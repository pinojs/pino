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
    const rawSites = getCallSites().slice(2)
    const validSites = []
    for (const callSite of rawSites) {
      const scriptName = callSite.scriptName
      if (typeof scriptName === 'string' && scriptName.length > 0) {
        validSites.push(scriptName)
      }
    }
    if (validSites.length > 0) {
      return validSites
    }
  }

  const originalPrepare = Error.prepareStackTrace
  Error.prepareStackTrace = noOpPrepareStackTrace
  const stack = new Error().stack
  Error.prepareStackTrace = originalPrepare

  if (!Array.isArray(stack)) {
    return []
  }

  const entries = stack.slice(2)
  const fileNames = []

  for (const entry of entries) {
    if (!entry) {
      continue
    }

    const fileName = entry.getFileName()
    if (fileName) {
      fileNames.push(fileName)
    }
  }

  return fileNames
}
