'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

test('pino exposes standard time functions', ({end, ok}) => {
  ok(pino.stdTimeFunctions)
  ok(pino.stdTimeFunctions.epochTime)
  ok(pino.stdTimeFunctions.unixTime)
  ok(pino.stdTimeFunctions.nullTime)
  end()
})

test('pino accepts external time functions', ({end, is}) => {
  var opts = {
    timestamp: function () {
      return ',"time":"none"'
    }
  }
  var instance = pino(opts, sink(function (chunk, enc) {
    is(chunk.hasOwnProperty('time'), true)
    is(chunk.time, 'none')
    end()
  }))
  instance.info('foobar')
})

test('inserts timestamp by default', ({end, ok, is}) => {
  var instance = pino(sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  instance.info('foobar')
})

test('omits timestamp with option', ({end, is}) => {
  var instance = pino({timestamp: false}, sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  instance.info('foobar')
})

test('child inserts timestamp by default', ({end, ok, is}) => {
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

test('child omits timestamp with option', ({end, is}) => {
  var logger = pino({timestamp: false}, sink(function (chunk, enc, cb) {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  var instance = logger.child({component: 'child'})
  instance.info('foobar')
})
