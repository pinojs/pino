'use strict'

function noOpPrepareStackTrace (_, stack) {
  return stack
}

module.exports = function getCaller () {
  const originalPrepare = Error.prepareStackTrace
  Error.prepareStackTrace = noOpPrepareStackTrace
  const stack = new Error().stack
  Error.prepareStackTrace = originalPrepare

  if (!Array.isArray(stack)) {
    return undefined
  }

  for (const entry of stack.slice(2)) {
    const file = entry ? entry.getFileName() : undefined

    if (file && file.indexOf('node_modules') === -1) {
      return file
    }
  }
}
