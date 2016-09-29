'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink
var check = require('./helper').check

test('does not test filters when level is inactive', function (t) {
  var filter = function () {
    t.fail('Should should not be called.')
  }

  var instance = pino({filter: filter}, sink(function () {
    t.fail('Should not downstream messages')
  }))

  instance.level = 'warn'
  instance.info('')
  t.end()
})

test('filters can reject messages', function (t) {
  t.plan(4)

  var filter = function (a) {
    return a === 'a'
  }
  var expected = [{
    level: 50,
    msg: 'a'
  }, {
    level: 60,
    msg: 'a'
  }]

  var instance = pino({filter: filter}, sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.error('a')
  instance.warn('b')
  instance.fatal('a')
  t.end()
})

test('child loggers inherit filter from parent', function (t) {
  t.plan(1)

  var filter = function (a) {
    return a === 'a'
  }

  var parent = pino({filter: filter}, sink(function (chunk, enc, cb) {
    t.deepEqual(chunk, {
      pid: chunk.pid,
      hostname: chunk.hostname,
      v: chunk.v,
      time: chunk.time,
      level: 60,
      msg: 'a',
      foo: 'bar'
    })
    cb()
  }))

  var child = parent.child({foo: 'bar'})
  child.warn('b')
  child.fatal('a')
  t.end()
})
