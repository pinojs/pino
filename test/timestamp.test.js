'use strict'

const { test } = require('tap')
const { sink } = require('./helper')
const pino = require('../')

test('pino exposes standard time functions', async ({ok}) => {
  ok(pino.stdTimeFunctions)
  ok(pino.stdTimeFunctions.epochTime)
  ok(pino.stdTimeFunctions.unixTime)
  ok(pino.stdTimeFunctions.nullTime)
})

test('pino accepts external time functions', async ({is}) => {
  const opts = {
    timestamp: () => ',"time":"none"'
  }
  const instance = pino(opts, sink((chunk, enc) => {
    is(chunk.hasOwnProperty('time'), true)
    is(chunk.time, 'none')
  }))
  instance.info('foobar')
})

test('inserts timestamp by default', async ({ok, is}) => {
  const instance = pino(sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
  }))
  instance.info('foobar')
})

test('omits timestamp with option', async ({is}) => {
  const instance = pino({timestamp: false}, sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
  }))
  instance.info('foobar')
})

test('child inserts timestamp by default', async ({ok, is}) => {
  const logger = pino(sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), true)
    ok(new Date(chunk.time) <= new Date(), 'time is greater than timestamp')
    is(chunk.msg, 'foobar')
    cb()
  }))
  const instance = logger.child({component: 'child'})
  instance.info('foobar')
})

test('child omits timestamp with option', async ({is}) => {
  const logger = pino({timestamp: false}, sink((chunk, enc, cb) => {
    is(chunk.hasOwnProperty('time'), false)
    is(chunk.msg, 'foobar')
    cb()
  }))
  const instance = logger.child({component: 'child'})
  instance.info('foobar')
})
