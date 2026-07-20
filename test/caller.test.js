'use strict'

const test = require('node:test')
const assert = require('node:assert')
const loop = require('./fixtures/caller-loop.js')
const proxyquire = require('proxyquire')

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

test('returns undefined when Error.prepareStackTrace is read-only', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(Error, 'prepareStackTrace')

  try {
    assert.ok(originalDescriptor)
    Object.defineProperty(Error, 'prepareStackTrace', {
      ...originalDescriptor,
      writable: false
    })
  } catch (err) {
    throw new Error(`failed to lock prepareStackTrace for regression test: ${err.message}`)
  }

  const getCallers = proxyquire('../lib/caller', {
    'node:util': {
      getCallSites: undefined,
      getCallSite: undefined
    }
  })

  try {
    const callers = getCallers()
    assert.equal(callers, undefined)
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(Error, 'prepareStackTrace', originalDescriptor)
    }
  }
})
