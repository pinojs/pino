'use strict'

const { test } = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

test('pino exposes standard time functions', async ({ ok }) => {
  ok(pino.stdTimeFunctions)
  ok(pino.stdTimeFunctions.epochTime)
  ok(pino.stdTimeFunctions.unixTime)
  ok(pino.stdTimeFunctions.nullTime)
})

test('pino accepts external time functions', async ({ is }) => {
  const opts = {
    timestamp: () => ',"time":"none"'
  }
  const stream = sink()
  const instance = pino(opts, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), true)
  is(result.time, 'none')
})

test('inserts timestamp by default', async ({ ok, is }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), true)
  ok(new Date(result.time) <= new Date(), 'time is greater than timestamp')
  is(result.msg, 'foobar')
})

test('omits timestamp when timestamp option is false', async ({ is }) => {
  const stream = sink()
  const instance = pino({ timestamp: false }, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), false)
  is(result.msg, 'foobar')
})

test('inserts timestamp when timestamp option is true', async ({ ok, is }) => {
  const stream = sink()
  const instance = pino({ timestamp: true }, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), true)
  ok(new Date(result.time) <= new Date(), 'time is greater than timestamp')
  is(result.msg, 'foobar')
})

test('child inserts timestamp by default', async ({ ok, is }) => {
  const stream = sink()
  const logger = pino(stream)
  const instance = logger.child({ component: 'child' })
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), true)
  ok(new Date(result.time) <= new Date(), 'time is greater than timestamp')
  is(result.msg, 'foobar')
})

test('child omits timestamp with option', async ({ is }) => {
  const stream = sink()
  const logger = pino({ timestamp: false }, stream)
  const instance = logger.child({ component: 'child' })
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), false)
  is(result.msg, 'foobar')
})

test('pino.stdTimeFunctions.unixTime returns seconds based timestamps', async ({ is }) => {
  const opts = {
    timestamp: pino.stdTimeFunctions.unixTime
  }
  const stream = sink()
  const instance = pino(opts, stream)
  const now = Date.now
  Date.now = () => 1531069919686
  instance.info('foobar')
  const result = await once(stream, 'data')
  is(result.hasOwnProperty('time'), true)
  is(result.time, 1531069920)
  Date.now = now
})
