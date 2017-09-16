'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

test('pino exposes standard time functions', function (t) {
  t.plan(5)
  t.ok(pino.stdTimeFunctions)
  t.ok(pino.stdTimeFunctions.epochTime)
  t.ok(pino.stdTimeFunctions.unixTime)
  t.ok(pino.stdTimeFunctions.slowTime)
  t.ok(pino.stdTimeFunctions.nullTime)
})

test('pino accepts external time functions', function (t) {
  t.plan(2)
  var opts = {
    timestamp: function () {
      return ',"time":"none"'
    }
  }
  var instance = pino(opts, sink(function (chunk, enc, cb) {
    t.equal(chunk.hasOwnProperty('time'), true)
    t.equal(chunk.time, 'none')
  }))
  instance.info('foobar')
})

test('inserts timestamp by default', function (t) {
  var instance = pino(sink(function (chunk, enc, cb) {
    t.equal(chunk.hasOwnProperty('time'), true)
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    t.equal(chunk.msg, 'foobar')
    cb()
    t.end()
  }))
  instance.info('foobar')
})

test('omits timestamp with option', function (t) {
  var instance = pino({timestamp: false}, sink(function (chunk, enc, cb) {
    t.equal(chunk.hasOwnProperty('time'), false)
    t.equal(chunk.msg, 'foobar')
    cb()
    t.end()
  }))
  instance.info('foobar')
})

test('child inserts timestamp by default', function (t) {
  var logger = pino(sink(function (chunk, enc, cb) {
    t.equal(chunk.hasOwnProperty('time'), true)
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    t.equal(chunk.msg, 'foobar')
    cb()
    t.end()
  }))
  var instance = logger.child({component: 'child'})
  instance.info('foobar')
})

test('child omits timestamp with option', function (t) {
  var logger = pino({timestamp: false}, sink(function (chunk, enc, cb) {
    t.equal(chunk.hasOwnProperty('time'), false)
    t.equal(chunk.msg, 'foobar')
    cb()
    t.end()
  }))
  var instance = logger.child({component: 'child'})
  instance.info('foobar')
})
