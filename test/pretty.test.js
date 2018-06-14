'use strict'

var Writable = require('stream').Writable
var test = require('tap').test
var pino = require('../')
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork

test('can be enabled via constructor', ({end, isNot}) => {
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'basic.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
    end()
  })
})

test('can be enabled via constructor with pretty configuration', ({end, isNot}) => {
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'level-first.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    isNot(actual.match(/^INFO.*h/), null)
    end()
  })
})

test('can be enabled via constructor with prettifier', ({end, isNot}) => {
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'pretty-factory.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    isNot(actual.match(/^INFO.*h/), null)
    end()
  })
})

test('does not throw error when enabled with stream specified', ({end}) => {
  pino({prettyPrint: true}, process.stdout)

  end()
})

test('can send pretty print to custom stream', ({end, is}) => {
  var dest = new Writable({
    objectMode: true,
    write (formatted, enc) {
      is(/^INFO.*foo\n$/.test(formatted), true)
      end()
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

test('ignores `undefined` from prettifier', ({end, is}) => {
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'skipped-output.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc) {
    actual += s
  }))

  child.on('close', function () {
    is(actual, '')
    end()
  })
})
