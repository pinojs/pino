'use strict'

var test = require('tap').test
var os = require('os')
var writeStream = require('flush-write-stream')
var spawn = require('child_process').spawn

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

  var extreme = pino({extreme: true}, writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  var i = 44
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var e = [
    'global.process = { __proto__: process,  pid: 123456 };',
    'Date.now = function () { return 1459875739796;};',
    'require("os").hostname = function () { return "abcdefghijklmnopqr"; }',
    ';var pino = require("./");',
    'var extreme = pino({extreme: true});extreme.info("h")'
  ].join('')

  var child = spawn('node', ['-e', e])
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

  var extreme = pino({extreme: true}, writeStream(function (s, enc, cb) {
    actual += s
    cb()
  })).child({ hello: 'world' })

  var i = 500
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  extreme.flush()

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var e = [
    'global.process = { __proto__: process,  pid: 123456 };',
    'Date.now = function () { return 1459875739796;};',
    'require("os").hostname = function () { return "abcdefghijklmnopqr";};',
    'var pino = require("./");',
    'var extreme = pino({extreme: true}).child({ hello: "world" });',
    'extreme.info("h")'
  ].join('')

  var child = spawn('node', ['-e', e])
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
