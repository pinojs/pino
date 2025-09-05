'use strict'

const { inspect } = require('node:util')

// Symbols for private properties
const loggerSym = Symbol('pino.console.logger')
const countMapSym = Symbol('pino.console.countMap')
const timersMapSym = Symbol('pino.console.timersMap')
const groupStackSym = Symbol('pino.console.groupStack')

/**
 * Console adapter that implements WHATWG Console API using Pino logger
 */
class Console {
  constructor (logger) {
    if (!logger || typeof logger.info !== 'function') {
      throw new TypeError('logger is required')
    }

    this[loggerSym] = logger
    this[countMapSym] = new Map()
    this[timersMapSym] = new Map()
    this[groupStackSym] = []

    // Add reference to constructor for Node.js Console compatibility
    this.Console = Console
  }

  // Core logging methods
  log (...args) {
    this._logWithLevel('info', ...args)
  }

  info (...args) {
    this._logWithLevel('info', ...args)
  }

  warn (...args) {
    this._logWithLevel('warn', ...args)
  }

  error (...args) {
    this._logWithLevel('error', ...args)
  }

  debug (...args) {
    this._logWithLevel('debug', ...args)
  }

  // Assertion logging
  assert (condition, ...args) {
    if (!condition) {
      const message = args.length > 0 ? args.join(' ') : ''
      const assertionMessage = message ? `Assertion failed: ${message}` : 'Assertion failed'
      this._logWithLevel('error', assertionMessage)
    }
  }

  // Stack trace logging
  trace (...args) {
    const logger = this[loggerSym]

    if (!logger.isLevelEnabled || !logger.isLevelEnabled('debug')) {
      return
    }

    const message = args.length > 0 ? args.join(' ') : 'Trace'
    const stack = new Error().stack

    // Remove the first line (Error:) and the trace() call itself
    const stackLines = stack.split('\n').slice(2)
    const trace = stackLines.join('\n')

    logger.debug({ trace }, message)
  }

  // Timing methods
  time (label = 'default') {
    this[timersMapSym].set(label, process.hrtime.bigint())
  }

  timeEnd (label = 'default') {
    const startTime = this[timersMapSym].get(label)
    if (!startTime) {
      this._logWithLevel('warn', `Timer '${label}' does not exist`)
      return
    }

    const endTime = process.hrtime.bigint()
    const elapsed = Number(endTime - startTime) / 1000000 // Convert to milliseconds
    this[timersMapSym].delete(label)
    this._logWithLevel('info', `${label}: ${elapsed.toFixed(3)}ms`)
  }

  timeLog (label = 'default', ...args) {
    const startTime = this[timersMapSym].get(label)
    if (!startTime) {
      this._logWithLevel('warn', `Timer '${label}' does not exist`)
      return
    }

    const currentTime = process.hrtime.bigint()
    const elapsed = Number(currentTime - startTime) / 1000000 // Convert to milliseconds
    const extraMessage = args.length > 0 ? ' ' + args.join(' ') : ''
    this._logWithLevel('info', `${label}: ${elapsed.toFixed(3)}ms${extraMessage}`)
  }

  // Counting methods
  count (label = 'default') {
    const current = this[countMapSym].get(label) || 0
    const newCount = current + 1
    this[countMapSym].set(label, newCount)
    this._logWithLevel('info', `${label}: ${newCount}`)
  }

  countReset (label = 'default') {
    this[countMapSym].delete(label)
  }

  // Grouping methods
  group (...args) {
    const label = args.length > 0 ? args.join(' ') : 'group'
    this[groupStackSym].push(label)
    this._logWithLevel('info', `▼ ${label}`)
  }

  groupCollapsed (...args) {
    const label = args.length > 0 ? args.join(' ') : 'group'
    this[groupStackSym].push(label)
    this._logWithLevel('info', `▶ ${label}`)
  }

  groupEnd () {
    const label = this[groupStackSym].pop()
    if (label) {
      this._logWithLevel('info', `▲ ${label}`)
    }
  }

  // Table display
  table (tabularData, properties) {
    if (Array.isArray(tabularData)) {
      // Simple table formatting for arrays of objects
      const formatted = tabularData.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          const filtered = properties
            ? Object.fromEntries(properties.map(prop => [prop, item[prop]]))
            : item
          return `${index}: ${inspect(filtered, { colors: false, depth: 1 })}`
        }
        return `${index}: ${item}`
      }).join('\n')

      this._logWithLevel('info', `Table:\n${formatted}`)
    } else if (typeof tabularData === 'object' && tabularData !== null) {
      this._logWithLevel('info', `Table:\n${inspect(tabularData, { colors: false, depth: 2 })}`)
    } else {
      this._logWithLevel('info', `Table: ${tabularData}`)
    }
  }

  // Object inspection
  dir (item, options = {}) {
    const inspectOptions = {
      showHidden: options.showHidden || false,
      depth: options.depth !== undefined ? options.depth : 2,
      colors: false,
      ...options
    }
    const output = inspect(item, inspectOptions)
    this._logWithLevel('info', output)
  }

  dirxml (...data) {
    // For non-DOM environments, dirxml behaves like dir
    data.forEach(item => {
      this.dir(item)
    })
  }

  // Clear method (for completeness)
  clear () {
    // In a logging context, we can't actually clear anything,
    // but we can log a clear indicator
    this._logWithLevel('info', '--- Console Clear ---')
  }

  // Inspector-only methods (for full Node.js Console compatibility)
  // These methods are no-ops in Pino context as they require the V8 inspector
  profile (label = 'default') {
    // No-op: Inspector-only functionality not applicable in logging context
    // Included for Node.js Console interface compatibility
  }

  profileEnd (label = 'default') {
    // No-op: Inspector-only functionality not applicable in logging context
    // Included for Node.js Console interface compatibility
  }

  timeStamp (label = 'default') {
    // No-op: Inspector-only functionality not applicable in logging context
    // Included for Node.js Console interface compatibility
  }

  // Helper method to handle logging with format specifiers
  _logWithLevel (level, ...args) {
    const logger = this[loggerSym]

    if (!logger.isLevelEnabled || !logger.isLevelEnabled(level)) {
      return
    }

    if (args.length === 0) {
      logger[level]('')
      return
    }

    // Handle format specifiers similar to console
    const first = args[0]
    if (typeof first === 'string' && first.includes('%')) {
      const formatted = this._formatWithSpecifiers(first, args.slice(1))
      logger[level](formatted.message, ...formatted.extra)
    } else if (args.length === 1) {
      logger[level](first)
    } else {
      // Multiple arguments - first is message, rest are extra data
      logger[level](first, ...args.slice(1))
    }
  }

  // Handle format specifiers like %s, %d, %o, etc.
  _formatWithSpecifiers (template, args) {
    let argIndex = 0
    const extra = []

    const message = template.replace(/%[sdioO%]/g, (match) => {
      if (match === '%%') return '%'
      if (argIndex >= args.length) return match

      const arg = args[argIndex++]
      switch (match) {
        case '%s': return String(arg)
        case '%d':
        case '%i': return parseInt(arg, 10) || 0
        case '%o':
        case '%O': return inspect(arg, { depth: null })
        default: return match
      }
    })

    // Any remaining args become extra data
    if (argIndex < args.length) {
      extra.push(...args.slice(argIndex))
    }

    return { message, extra }
  }
}

module.exports = Console
