'use strict'

const { test } = require('tap')
const { sink } = require('./helper')
const pino = require('../')

test('pino exposes standard time functions', ({end, ok}) => {
  ok(pino.stdTimeFunctions)
  ok(pino.stdTimeFunctions.epochTime)
  ok(pino.stdTimeFunctions.unixTime)
  ok(pino.stdTimeFunctions.nullTime)
  end()
})

test('pino accepts external time functions', ({end, is}) => {
  const opts = {
    timestamp: () => ',"time":"none"'
  }
  const instance = pino(opts, sink((chunk, enc) => {
    is(chunk.hasOwnProperty('time'), true)
    is(chunk.time, 'none')
    end()
  }))
  instance.info('foobar')
})

test('inserts timestamp by default', ({end, ok, is}) => {
  const instance = pino(sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  instance.info('foobar')
})

test('omits timestamp with option', ({end, is}) => {
  const instance = pino({timestamp: false}, sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  instance.info('foobar')
})

test('child inserts timestamp by default', ({end, ok, is}) => {
  const logger = pino(sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  const instance = logger.child({component: 'child'})
  instance.info('foobar')
})

test('child omits timestamp with option', ({end, is}) => {
  const logger = pino({timestamp: false}, sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
    end()
  }))
  const instance = logger.child({component: 'child'})
  instance.info('foobar')
})
