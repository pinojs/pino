'use strict'

const fs = require('fs')

function noOpPrepareStackTrace (_, stack) {
  return stack
}

function isOutsideNodeModules (input) {
  return typeof input === 'string' && fs.existsSync(input) && input.indexOf('node_modules') === -1
}

module.exports = function getCaller () {
  const originalPrepare = Error.prepareStackTrace
  Error.prepareStackTrace = noOpPrepareStackTrace
  const stack = new Error().stack
  Error.prepareStackTrace = originalPrepare

  if (!Array.isArray(stack)) {
    return undefined
  }

  const entries = stack.slice(2)

  for (const entry of entries) {
    const file = entry ? entry.getFileName() : undefined

    if (isOutsideNodeModules(file)) {
      return file
    }
  }

  return entries[0] ? entries[0].getFileName() : undefined
}
