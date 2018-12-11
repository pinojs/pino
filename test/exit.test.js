'use strict'

const { test } = require('tap')
const { join } = require('path')
const execa = require('execa')
const writer = require('flush-write-stream')
const { once } = require('./helper')

// https://github.com/pinojs/pino/issues/542
test('pino.destination log everything when calling process.exit(0)', async ({ isNot }) => {
  var actual = ''
  const child = execa(process.argv[0], [join(__dirname, 'fixtures', 'destination-exit.js')])

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  isNot(actual.match(/hello/), null)
  isNot(actual.match(/world/), null)
})

test('pino.extreme does not log everything when calling process.exit(0)', async ({ is }) => {
  var actual = ''
  const child = execa(process.argv[0], [join(__dirname, 'fixtures', 'extreme-exit.js')])

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  is(actual.match(/hello/), null)
  is(actual.match(/world/), null)
})

test('pino.extreme logs everything when calling flushSync', async ({ isNot }) => {
  var actual = ''
  const child = execa(process.argv[0], [join(__dirname, 'fixtures', 'extreme-flush-exit.js')])

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  isNot(actual.match(/hello/), null)
  isNot(actual.match(/world/), null)
})
