'use strict'

var Writable = require('stream').Writable
var test = require('tap').test
var pino = require('../')
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork

test('can be enabled via constructor', function (t) {
  t.plan(1)
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'basic.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
  })
})

test('can be enabled via constructor with pretty configuration', function (t) {
  t.plan(1)
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'levelFirst.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(actual.match(/^INFO.*h/), null)
  })
})

test('can be enabled via constructor with prettifier', function (t) {
  t.plan(1)
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'prettyFactory.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(actual.match(/^INFO.*h/), null)
  })
})

test('does not throw error when enabled with stream specified', function (t) {
  pino({prettyPrint: true}, process.stdout)
  t.end()
})

test('can send pretty print to custom stream', function (t) {
  t.plan(1)

  var dest = new Writable({
    objectMode: true,
    write (formatted, enc, cb) {
      t.match(formatted, /^INFO.*foo\n$/)
      cb()
    }
  })

  var log = pino({
    prettifier: require('pino-pretty'),
    prettyPrint: {
      levelFirst: true
    }
  }, dest)
  log.info('foo')
})

test('ignores `undefined` from prettifier', function (t) {
  t.plan(1)
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'skippedOutput.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    t.is(actual, '')
  })
})
