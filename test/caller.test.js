'use strict'

const test = require('node:test')
const assert = require('node:assert')
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

test('does not throw when Error.prepareStackTrace is read-only', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(Error, 'prepareStackTrace')
  Object.defineProperty(Error, 'prepareStackTrace', {
    value: undefined,
    writable: false,
    configurable: true
  })
  t.after(() => {
    if (descriptor) {
      Object.defineProperty(Error, 'prepareStackTrace', descriptor)
    } else {
      delete Error.prepareStackTrace
    }
  })

  assert.ok(Array.isArray(loop(0)))
})

test('ignores the stack trace when it is not captured as call sites', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(Error, 'prepareStackTrace')
  Object.defineProperty(Error, 'prepareStackTrace', {
    get () {},
    set () {},
    configurable: true
  })
  t.after(() => {
    if (descriptor) {
      Object.defineProperty(Error, 'prepareStackTrace', descriptor)
    } else {
      delete Error.prepareStackTrace
    }
  })

  assert.ok(Array.isArray(loop(0)))
})
