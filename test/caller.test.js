'use strict'

const test = require('node:test')
const assert = require('node:assert')
const loop = require('./fixtures/caller-loop.js')

test('returns a callstack of absolute paths', () => {
  const callers = loop(7).map(fileName => fileName.substring(__dirname.length))

  // default callstack size is 10, but the top 2 are dropped
  assert.deepStrictEqual(callers, [
    '/fixtures/caller-loop.js',
    '/fixtures/caller-loop.js',
    '/fixtures/caller-loop.js',
    '/fixtures/caller-loop.js',
    '/fixtures/caller-loop.js',
    '/fixtures/caller-loop.js',
    '/fixtures/caller-loop.js',
    '/caller.test.js',
  ])
})
