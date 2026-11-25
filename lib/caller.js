'use strict'

const util = require('node:util')

// getCallSite requires Node >=22.9.0
// getCallSite was renamed in Node 23.3.0 / 22.12.0
const getCallSites = util.getCallSites ?? util.getCallSite

function noOpPrepareStackTrace (_, stack) {
  return stack
}

module.exports = function getCallers () {
  const fileNames = []

  if (getCallSites) {
    for (const callSite of getCallSites().slice(2)) {
      if (callSite.scriptName) {
        fileNames.push(callSite.scriptName)
      }
    }
  }

  // getCallSites() misses async frames and runtime-evaluated code
  for (const fileName of getStackFileNames()) {
    if (!fileNames.includes(fileName)) {
      fileNames.push(fileName)
    }
  }

  return fileNames
}

function getStackFileNames () {
  const originalPrepare = Error.prepareStackTrace
  let stack

  try {
    Error.prepareStackTrace = noOpPrepareStackTrace
    stack = new Error().stack
  } catch {
    return []
  } finally {
    try {
      Error.prepareStackTrace = originalPrepare
    } catch {}
  }

  if (!Array.isArray(stack)) {
    return []
  }

  const fileNames = []

  for (const entry of stack.slice(3)) {
    const fileName = entry?.getFileName()
    if (fileName) {
      fileNames.push(fileName)
    }
  }

  return fileNames
}
