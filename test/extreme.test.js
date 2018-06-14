'use strict'

const os = require('os')
const { createWriteStream } = require('fs')
const { join } = require('path')
const { test } = require('tap')
const { fork } = require('child_process')
const writer = require('flush-write-stream')

test('extreme mode', ({end, is, teardown}) => {
  var now = Date.now
  var hostname = os.hostname
  var proc = process
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
  var normal = pino(writer((s, enc, cb) => {
    expected += s
    cb()
  }))

  var dest = createWriteStream('/dev/null')
  dest.write = (s) => {
    actual += s
  }
  var extreme = pino(dest)

  var i = 44
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var child = fork(join(__dirname, '/fixtures/extreme.js'), {silent: true})
  child.stdout.pipe(writer((s, enc, cb) => {
    actual2 += s
    cb()
  }))

  child.on('close', function () {
    is(actual, expected)
    is(actual2.trim(), expected2)

    teardown(() => {
      os.hostname = hostname
      Date.now = now
      global.process = proc
    })

    end()
  })
})

test('extreme mode with child', ({end, is, teardown}) => {
  var now = Date.now
  var hostname = os.hostname
  var proc = process
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
  var normal = pino(writer((s, enc, cb) => {
    expected += s
    cb()
  })).child({ hello: 'world' })

  var dest = createWriteStream('/dev/null')
  dest.write = function (s) { actual += s }
  var extreme = pino(dest).child({ hello: 'world' })

  var i = 500
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  extreme.flush()

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var child = fork(join(__dirname, '/fixtures/extreme-child.js'), {silent: true})
  child.stdout.pipe(writer((s, enc, cb) => {
    actual2 += s
    cb()
  }))

  child.on('close', function () {
    is(actual, expected)
    is(actual2.trim(), expected2)

    teardown(() => {
      os.hostname = hostname
      Date.now = now
      global.process = proc
    })

    end()
  })
})

test('throw an error if extreme is passed', ({end, throws}) => {
  var pino = require('..')
  throws(() => {
    pino({extreme: true})
  })

  end()
})

test('flush does nothing without extreme mode', ({end}) => {
  var instance = require('..')()
  instance.flush()

  end()
})
