'use strict'

/* eslint no-prototype-builtins: 0 */

const format = require('quick-format-unescaped')
const { mapHttpRequest, mapHttpResponse } = require('pino-std-serializers')
const SonicBoom = require('sonic-boom')
const warning = require('./deprecations')
const {
  lsCacheSym,
  chindingsSym,
  writeSym,
  serializersSym,
  formatOptsSym,
  endSym,
  stringifiersSym,
  stringifySym,
  stringifySafeSym,
  wildcardFirstSym,
  streamSym,
  nestedKeySym,
  formattersSym,
  messageKeySym,
  nestedKeyStrSym
} = require('./symbols')
const { isMainThread } = require('worker_threads')
const transport = require('./transport')

function noop () {}

function genLog (level, hook) {
  if (!hook) return LOG

  return function hookWrappedLog (...args) {
    hook.call(this, args, LOG, level)
  }

  function LOG (o, ...n) {
    if (typeof o === 'object') {
      let msg = o
      if (o !== null) {
        if (o.method && o.headers && o.socket) {
          o = mapHttpRequest(o)
        } else if (typeof o.setHeader === 'function') {
          o = mapHttpResponse(o)
        }
      }
      let formatParams
      if (msg === null && n.length === 0) {
        formatParams = [null]
      } else {
        msg = n.shift()
        formatParams = n
      }
      this[writeSym](o, format(msg, formatParams, this[formatOptsSym]), level)
    } else {
      this[writeSym](null, format(o, n, this[formatOptsSym]), level)
    }
  }
}

// magically escape strings for json
// relying on their charCodeAt
// everything below 32 needs JSON.stringify()
// 34 and 92 happens all the time, so we
// have a fast case for them
function asString (str) {
  let result = ''
  let last = 0
  let found = false
  let point = 255
  const l = str.length
  if (l > 100) {
    return JSON.stringify(str)
  }
  for (var i = 0; i < l && point >= 32; i++) {
    point = str.charCodeAt(i)
    if (point === 34 || point === 92) {
      result += str.slice(last, i) + '\\'
      last = i
      found = true
    }
  }
  if (!found) {
    result = str
  } else {
    result += str.slice(last)
  }
  return point < 32 ? JSON.stringify(str) : '"' + result + '"'
}

function asJson (obj, msg, num, time) {
  const stringify = this[stringifySym]
  const stringifySafe = this[stringifySafeSym]
  const stringifiers = this[stringifiersSym]
  const end = this[endSym]
  const chindings = this[chindingsSym]
  const serializers = this[serializersSym]
  const formatters = this[formattersSym]
  const messageKey = this[messageKeySym]
  let data = this[lsCacheSym][num] + time

  // we need the child bindings added to the output first so instance logged
  // objects can take precedence when JSON.parse-ing the resulting log line
  data = data + chindings

  let value
  const notHasOwnProperty = obj.hasOwnProperty === undefined
  if (formatters.log) {
    obj = formatters.log(obj)
  }
  const wildcardStringifier = stringifiers[wildcardFirstSym]
  let propStr = ''
  for (const key in obj) {
    value = obj[key]
    if ((notHasOwnProperty || obj.hasOwnProperty(key)) && value !== undefined) {
      value = serializers[key] ? serializers[key](value) : value

      const stringifier = stringifiers[key] || wildcardStringifier

      switch (typeof value) {
        case 'undefined':
        case 'function':
          continue
        case 'number':
          /* eslint no-fallthrough: "off" */
          if (Number.isFinite(value) === false) {
            value = null
          }
        // this case explicitly falls through to the next one
        case 'boolean':
          if (stringifier) value = stringifier(value)
          break
        case 'string':
          value = (stringifier || asString)(value)
          break
        default:
          value = (stringifier || stringify)(value, stringifySafe)
      }
      if (value === undefined) continue
      propStr += ',"' + key + '":' + value
    }
  }

  let msgStr = ''
  if (msg !== undefined) {
    value = serializers[messageKey] ? serializers[messageKey](msg) : msg
    const stringifier = stringifiers[messageKey] || wildcardStringifier

    switch (typeof value) {
      case 'function':
        break
      case 'number':
        /* eslint no-fallthrough: "off" */
        if (Number.isFinite(value) === false) {
          value = null
        }
      // this case explicitly falls through to the next one
      case 'boolean':
        if (stringifier) value = stringifier(value)
        msgStr = ',"' + messageKey + '":' + value
        break
      case 'string':
        value = (stringifier || asString)(value)
        msgStr = ',"' + messageKey + '":' + value
        break
      default:
        value = (stringifier || stringify)(value, stringifySafe)
        msgStr = ',"' + messageKey + '":' + value
    }
  }

  if (this[nestedKeySym] && propStr) {
    // place all the obj properties under the specified key
    // the nested key is already formatted from the constructor
    return data + this[nestedKeyStrSym] + propStr.slice(1) + '}' + msgStr + end
  } else {
    return data + propStr + msgStr + end
  }
}

function asChindings (instance, bindings) {
  let value
  let data = instance[chindingsSym]
  const stringify = instance[stringifySym]
  const stringifySafe = instance[stringifySafeSym]
  const stringifiers = instance[stringifiersSym]
  const wildcardStringifier = stringifiers[wildcardFirstSym]
  const serializers = instance[serializersSym]
  const formatter = instance[formattersSym].bindings
  bindings = formatter(bindings)

  for (const key in bindings) {
    value = bindings[key]
    const valid = key !== 'level' &&
      key !== 'serializers' &&
      key !== 'formatters' &&
      key !== 'customLevels' &&
      bindings.hasOwnProperty(key) &&
      value !== undefined
    if (valid === true) {
      value = serializers[key] ? serializers[key](value) : value
      value = (stringifiers[key] || wildcardStringifier || stringify)(value, stringifySafe)
      if (value === undefined) continue
      data += ',"' + key + '":' + value
    }
  }
  return data
}

function hasBeenTampered (stream) {
  return stream.write !== stream.constructor.prototype.write
}

function buildSafeSonicBoom (opts) {
  const stream = new SonicBoom(opts)
  stream.on('error', filterBrokenPipe)
  // if we are sync: false, we must flush on exit
  if (!opts.sync && isMainThread) {
    setupOnExit(stream)
  }
  return stream

  function filterBrokenPipe (err) {
    // Impossible to replicate across all operating systems
    /* istanbul ignore next */
    if (err.code === 'EPIPE') {
      // If we get EPIPE, we should stop logging here
      // however we have no control to the consumer of
      // SonicBoom, so we just overwrite the write method
      stream.write = noop
      stream.end = noop
      stream.flushSync = noop
      stream.destroy = noop
      return
    }
    stream.removeListener('error', filterBrokenPipe)
    stream.emit('error', err)
  }
}

function setupOnExit (stream) {
  /* istanbul ignore next */
  if (global.WeakRef && global.WeakMap && global.FinalizationRegistry) {
    // This is leak free, it does not leave event handlers
    const onExit = require('on-exit-leak-free')

    onExit.register(stream, autoEnd)

    stream.on('close', function () {
      onExit.unregister(stream)
    })
  }
}

function autoEnd (stream, eventName) {
  // This check is needed only on some platforms
  /* istanbul ignore next */
  if (stream.destroyed) {
    return
  }

  if (eventName === 'beforeExit') {
    // We still have an event loop, let's use it
    stream.flush()
    stream.on('drain', function () {
      stream.end()
    })
  } else {
    // We do not have an event loop, so flush synchronously
    stream.flushSync()
  }
}

function createArgsNormalizer (defaultOptions) {
  return function normalizeArgs (instance, caller, opts = {}, stream) {
    // support stream as a string
    if (typeof opts === 'string') {
      stream = buildSafeSonicBoom({ dest: opts, sync: true })
      opts = {}
    } else if (typeof stream === 'string') {
      if (opts && opts.transport) {
        throw Error('only one of option.transport or stream can be specified')
      }
      stream = buildSafeSonicBoom({ dest: stream, sync: true })
    } else if (opts instanceof SonicBoom || opts.writable || opts._writableState) {
      stream = opts
      opts = {}
    } else if (opts.transport) {
      stream = transport({ caller, ...opts.transport })
    }
    opts = Object.assign({}, defaultOptions, opts)
    opts.serializers = Object.assign({}, defaultOptions.serializers, opts.serializers)
    if (opts.prettyPrint) {
      throw new Error('prettyPrint option is no longer supported, see the pino-pretty package.')
    }
    const { enabled } = opts
    if (enabled === false) opts.level = 'silent'
    stream = stream || process.stdout
    if (stream === process.stdout && stream.fd >= 0 && !hasBeenTampered(stream)) {
      stream = buildSafeSonicBoom({ fd: stream.fd, sync: true })
    }
    return { opts, stream }
  }
}

function final (logger, handler) {
  const major = Number(process.versions.node.split('.')[0])
  /* istanbul ignore next */
  if (major >= 14) warning.emit('PINODEP009')

  /* istanbul ignore next */
  if (typeof logger === 'undefined' || typeof logger.child !== 'function') {
    throw Error('expected a pino logger instance')
  }
  const hasHandler = (typeof handler !== 'undefined')
  if (hasHandler && typeof handler !== 'function') {
    throw Error('if supplied, the handler parameter should be a function')
  }
  const stream = logger[streamSym]
  if (typeof stream.flushSync !== 'function') {
    throw Error('final requires a stream that has a flushSync method, such as pino.destination')
  }

  const finalLogger = new Proxy(logger, {
    get: (logger, key) => {
      if (key in logger.levels.values) {
        return (...args) => {
          logger[key](...args)
          stream.flushSync()
        }
      }
      return logger[key]
    }
  })

  if (!hasHandler) {
    try {
      stream.flushSync()
    } catch {
      // it's too late to wait for the stream to be ready
      // because this is a final tick scenario.
      // in practice there shouldn't be a situation where it isn't
      // however, swallow the error just in case (and for easier testing)
    }
    return finalLogger
  }

  return (err = null, ...args) => {
    try {
      stream.flushSync()
    } catch (e) {
      // it's too late to wait for the stream to be ready
      // because this is a final tick scenario.
      // in practice there shouldn't be a situation where it isn't
      // however, swallow the error just in case (and for easier testing)
    }
    return handler(err, finalLogger, ...args)
  }
}

function stringify (obj, stringifySafeFn) {
  try {
    return JSON.stringify(obj)
  } catch (_) {
    try {
      const stringify = stringifySafeFn || this[stringifySafeSym]
      return stringify(obj)
    } catch (_) {
      return '"[unable to serialize, circular reference is too complex to analyze]"'
    }
  }
}

function buildFormatters (level, bindings, log) {
  return {
    level,
    bindings,
    log
  }
}

/**
 * Convert a string integer file descriptor to a proper native integer
 * file descriptor.
 *
 * @param {string} destination The file descriptor string to attempt to convert.
 *
 * @returns {Number}
 */
function normalizeDestFileDescriptor (destination) {
  const fd = Number(destination)
  if (typeof destination === 'string' && Number.isFinite(fd)) {
    return fd
  }
  return destination
}

module.exports = {
  noop,
  buildSafeSonicBoom,
  asChindings,
  asJson,
  genLog,
  createArgsNormalizer,
  final,
  stringify,
  buildFormatters,
  normalizeDestFileDescriptor
}
