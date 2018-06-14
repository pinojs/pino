'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

test('pino exposes standard time functions', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  ok(pino.stdTimeFunctions)
  ok(pino.stdTimeFunctions.epochTime)
  ok(pino.stdTimeFunctions.unixTime)
  ok(pino.stdTimeFunctions.nullTime)
  end()
})

test('pino accepts external time functions', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var opts = {
    timestamp: function () {
      return ',"time":"none"'
    }
  }
  var instance = pino(opts, sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), true)
    is(chunk.time, 'none')
    end()
  }))
  instance.info('foobar')
})

test('inserts timestamp by default', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino(sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  instance.info('foobar')
})

test('omits timestamp with option', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({timestamp: false}, sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  instance.info('foobar')
})

test('child inserts timestamp by default', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino(sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  var instance = logger.child({component: 'child'})
  instance.info('foobar')
})

test('child omits timestamp with option', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({timestamp: false}, sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  var instance = logger.child({component: 'child'})
  instance.info('foobar')
})
