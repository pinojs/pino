'use strict'

var test = require('tap').test
var sink = require('./helper').sink
var pino = require('../')

test('can add a custom level via constructor', function (t) {
  t.plan(2)

  var log = pino({level: 'foo', levelVal: 35}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    cb()
  }))

  t.is(typeof log.foo, 'function')
  log.foo('bar')
})

test('can add a custom level to a prior instance', function (t) {
  t.plan(2)

  var log = pino(sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
  }))

  log.addLevel('foo2', 35)
  t.is(typeof log.foo2, 'function')
  log.foo2('bar')
})

test('custom level via constructor does not affect other instances', function (t) {
  t.plan(2)

  var log = pino({level: 'foo3', levelVal: 36})
  var other = pino()
  t.is(typeof log.foo3, 'function')
  t.is(typeof other.foo3, 'undefined')
})

test('custom level on one instance does not affect other instances', function (t) {
  t.plan(2)

  var log = pino()
  log.addLevel('foo4', 37)
  var other = pino()
  log.addLevel('foo5', 38)
  t.is(typeof other.foo4, 'undefined')
  t.is(typeof other.foo5, 'undefined')
})

test('custom levels encompass higher levels', function (t) {
  t.plan(1)

  var log = pino({level: 'foo', levelVal: 35}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    cb()
  }))

  log.warn('bar')
})

test('after the fact add level does not include lower levels', function (t) {
  t.plan(1)

  var log = pino(sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    cb()
  }))

  log.addLevel('foo', 35)
  log.level = 'foo'
  log.info('nope')
  log.foo('bar')
})

test('after the fact add of a lower level does not include it', function (t) {
  t.plan(1)

  var log = pino(sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    cb()
  }))

  log.level = 'info'
  log.addLevel('foo', 15)
  log.info('bar')
  log.foo('nope')
})

test('children can be set to custom level', function (t) {
  t.plan(2)

  var parent = pino({level: 'foo', levelVal: 35}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    t.is(chunk.child, 'yes')
    cb()
  }))
  var child = parent.child({child: 'yes'})
  child.foo('bar')
})

test('custom levels exists on children', function (t) {
  t.plan(2)

  var parent = pino({}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    t.is(chunk.child, 'yes')
    cb()
  }))
  parent.addLevel('foo', 35)
  var child = parent.child({child: 'yes'})
  child.foo('bar')
})

test('rejects already known labels', function (t) {
  t.plan(1)
  var log = pino({level: 'info', levelVal: 900})
  t.is(log.levelVal, 30)
})

test('reject already known values', function (t) {
  t.plan(1)
  try {
    pino({level: 'foo', levelVal: 30})
  } catch (e) {
    t.is(e.message.indexOf('level value') > -1, true)
  }
})

test('reject values of Infinity', function (t) {
  t.plan(1)
  t.throws(function () {
    pino({level: 'foo', levelVal: Infinity})
  }, /.*level value is already used.*/)
})

test('level numbers are logged correctly after level change', function (t) {
  t.plan(1)
  var log = pino({level: 'foo', levelVal: 25}, sink(function (chunk, enc, cb) {
    t.is(chunk.level, 25)
  }))
  log.level = 'debug'
  log.foo('bar')
})

test('levels state is not shared between instances', function (t) {
  t.plan(2)

  var instance1 = pino({level: 'foo', levelVal: 35})
  t.is(typeof instance1.foo, 'function')

  var instance2 = pino()
  t.is(instance2.hasOwnProperty('foo'), false)
})
