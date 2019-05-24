'use strict'

const os = require('os')
const { createWriteStream } = require('fs')
const { join } = require('path')
const { test } = require('tap')
const { fork } = require('child_process')
const writer = require('flush-write-stream')
const { once, getPathToNull } = require('./helper')

test('extreme mode', async ({ is, teardown }) => {
  const now = Date.now
  const hostname = os.hostname
  const proc = process
  global.process = {
    __proto__: process,
    pid: 123456
  }
  Date.now = () => 1459875739796
  os.hostname = () => 'abcdefghijklmnopqr'
  delete require.cache[require.resolve('../')]
  const pino = require('../')
  var expected = ''
  var actual = ''
  const normal = pino(writer((s, enc, cb) => {
    expected += s
    cb()
  }))

  const dest = createWriteStream(getPathToNull())
  dest.write = (s) => {
    actual += s
  }
  const extreme = pino(dest)

  var i = 44
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  const child = fork(join(__dirname, '/fixtures/extreme.js'), { silent: true })
  child.stdout.pipe(writer((s, enc, cb) => {
    actual2 += s
    cb()
  }))
  await once(child, 'close')
  is(actual, expected)
  is(actual2.trim(), expected2)

  teardown(() => {
    os.hostname = hostname
    Date.now = now
    global.process = proc
  })
})

test('extreme mode with child', async ({ is, teardown }) => {
  const now = Date.now
  const hostname = os.hostname
  const proc = process
  global.process = {
    __proto__: process,
    pid: 123456
  }
  Date.now = function () {
    return 1459875739796
  }
  os.hostname = function () {
    return 'abcdefghijklmnopqr'
  }
  delete require.cache[require.resolve('../')]
  const pino = require('../')
  var expected = ''
  var actual = ''
  const normal = pino(writer((s, enc, cb) => {
    expected += s
    cb()
  })).child({ hello: 'world' })

  const dest = createWriteStream(getPathToNull())
  dest.write = function (s) { actual += s }
  const extreme = pino(dest).child({ hello: 'world' })

  var i = 500
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  extreme.flush()

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  const child = fork(join(__dirname, '/fixtures/extreme-child.js'), { silent: true })
  child.stdout.pipe(writer((s, enc, cb) => {
    actual2 += s
    cb()
  }))
  await once(child, 'close')
  is(actual, expected)
  is(actual2.trim(), expected2)

  teardown(() => {
    os.hostname = hostname
    Date.now = now
    global.process = proc
  })
})

test('throw an error if extreme is passed', async ({ throws }) => {
  const pino = require('..')
  throws(() => {
    pino({ extreme: true })
  })
})

test('flush does nothing without extreme mode', async () => {
  var instance = require('..')()
  instance.flush()
})
