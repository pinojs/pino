'use strict'

const util = require('node:util')

// getCallSite requires Node >=22.9.0
// getCallSite was renamed in Node 23.3.0 / 22.12.0
const getCallSites = util.getCallSites ?? util.getCallSite

function noOpPrepareStackTrace (_, stack) {
  return stack
}

module.exports = function getCallers () {
  if (getCallSites) {
    return getCallSites().slice(2).map(callSite => callSite.scriptName)
  }

  const originalPrepare = Error.prepareStackTrace
  let stack

  try {
    Error.prepareStackTrace = noOpPrepareStackTrace
    stack = new Error().stack
  } catch (err) {
    return undefined
  } finally {
    try {
      Error.prepareStackTrace = originalPrepare
    } catch (err) {
      // Ignore cases where prepareStackTrace is not writable.
    }
  }

  if (!Array.isArray(stack)) {
    return undefined
  }

  const entries = stack.slice(2)

  const fileNames = []

  for (const entry of entries) {
    if (!entry) {
      continue
    }

    fileNames.push(entry.getFileName())
  }

  return fileNames
}
