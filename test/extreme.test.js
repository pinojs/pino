'use strict'

var test = require('tap').test
var fs = require('fs')
var os = require('os')
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork

test('extreme mode', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, teardown}) => {
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
  var pino = require('../')
  var expected = ''
  var actual = ''
  var normal = pino(writeStream(function (s, enc, cb) {
    expected += s
    cb()
  }))

  var dest = fs.createWriteStream('/dev/null')
  dest.write = function (s) { actual += s }
  var extreme = pino(dest)

  var i = 44
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var child = fork(path.join(__dirname, '/fixtures/extreme.js'), {silent: true})
  child.stdout.pipe(writeStream(function (s, enc, cb) {
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

test('extreme mode with child', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, teardown}) => {
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
  var pino = require('../')
  var expected = ''
  var actual = ''
  var normal = pino(writeStream(function (s, enc, cb) {
    expected += s
    cb()
  })).child({ hello: 'world' })

  var dest = fs.createWriteStream('/dev/null')
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

  var child = fork(path.join(__dirname, '/fixtures/extreme-child.js'), {silent: true})
  child.stdout.pipe(writeStream(function (s, enc, cb) {
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

test('throw an error if extreme is passed', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var pino = require('..')
  throws(() => {
    pino({extreme: true})
  })

  end()
})

test('flush does nothing without extreme mode', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = require('..')()
  instance.flush()

  end()
})
