'use strict'

const test = require('node:test')
const assert = require('node:assert')
const util = require('node:util')
const loop = require('./fixtures/caller-loop.js')

test('returns a callstack of absolute paths', () => {
  const callers = loop(7).map(fileName => fileName.substring(__dirname.length))

  // default callstack size is 10, but the top 2 are dropped
  assert.equal(callers.length, 8)
  assert.match(callers[0], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[1], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[2], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[3], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[4], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[5], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[6], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[7], /^[/\\]caller\.test\.js$/)
})

test('does not throw when prepareStackTrace is read-only', () => {
  const originalGetCallSite = util.getCallSite
  const originalGetCallSites = util.getCallSites
  const originalPrepareStackTrace = Object.getOwnPropertyDescriptor(Error, 'prepareStackTrace')
  const callerPath = require.resolve('../lib/caller.js')

  util.getCallSite = undefined
  util.getCallSites = undefined
  Object.defineProperty(Error, 'prepareStackTrace', {
    value: undefined,
    writable: false,
    configurable: true
  })
  delete require.cache[callerPath]

  try {
    const getCallers = require('../lib/caller.js')
    assert.equal(getCallers(), undefined)
  } finally {
    util.getCallSite = originalGetCallSite
    util.getCallSites = originalGetCallSites
    if (originalPrepareStackTrace) {
      Object.defineProperty(Error, 'prepareStackTrace', originalPrepareStackTrace)
    } else {
      delete Error.prepareStackTrace
    }
    delete require.cache[callerPath]
  }
})
