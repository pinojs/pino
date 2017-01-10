'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

test('can add a custom level', function (t) {
  t.plan(3)

  var result = pino.addLevel('foo', 35)
  t.is(result, true)

  var log = pino({level: 'foo'}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    cb()
  }))

  t.is(typeof log.foo, 'function')
  log.foo('bar')
})

test('custom levels encompass higher levels', function (t) {
  t.plan(1)

  pino.addLevel('foo', 35)
  var log = pino({level: 'foo'}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    cb()
  }))

  log.warn('bar')
})

test('children can be set to custom level', function (t) {
  t.plan(2)

  pino.addLevel('foo', 35)
  var parent = pino({level: 'foo'}, sink(function (chunk, enc, cb) {
    t.is(chunk.msg, 'bar')
    t.is(chunk.child, 'yes')
    cb()
  }))
  var child = parent.child({child: 'yes'})
  child.foo('bar')
})

test('rejects already known labels', function (t) {
  t.plan(1)
  var result = pino.addLevel('info', 900)
  t.is(result, false)
})

test('reject already known values', function (t) {
  t.plan(1)
  var result = pino.addLevel('foo', 30)
  t.is(result, false)
})
