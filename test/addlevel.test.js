'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

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

  log.addLevel('foo', 35)
  t.is(typeof log.foo, 'function')
  log.foo('bar')
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
