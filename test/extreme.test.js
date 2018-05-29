'use strict'

var test = require('tap').test
var fs = require('fs')
var os = require('os')
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork

if (process.version.indexOf('v0.10') >= 0) {
  require('tap').comment('skipped because of node v0.10')
  process.exit(0)
}

test('extreme mode', function (t) {
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
    t.is(actual, expected)
    t.is(actual2.trim(), expected2)

    t.teardown(function () {
      os.hostname = hostname
      Date.now = now
      global.process = proc
    })

    t.end()
  })
})

test('extreme mode with child', function (t) {
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

  var child = fork(path.join(__dirname, '/fixtures/extreme_child.js'), {silent: true})
  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual2 += s
    cb()
  }))

  child.on('close', function () {
    t.is(actual, expected)
    t.is(actual2.trim(), expected2)

    t.teardown(function () {
      os.hostname = hostname
      Date.now = now
      global.process = proc
    })

    t.end()
  })
})

test('throw an error if extreme is passed', function (t) {
  var pino = require('..')
  t.throws(() => {
    pino({extreme: true})
  })
  t.end()
})

test('flush does nothing without extreme mode', function (t) {
  var instance = require('..')()
  instance.flush()
  t.end()
})

test('flushSync does something with extreme mode', function (t) {
  var instance = require('..')()
  instance.flushSync()
  t.end()
})

test('flushSync ensure stream is not writing', function (t) {
  var pino = require('../')
  var dest = pino.extreme()
  var instance = pino(dest)
  dest.write('hello world')
  instance.flush()
  t.equal(instance.stream._writing, true)
  instance.flushSync()
  t.equal(instance.stream._writing, false)
  t.end()
})
