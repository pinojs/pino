'use strict'

/* eslint no-prototype-builtins: 0 */

const { test } = require('node:test')
const { sink, once } = require('./helper')
const pino = require('../')

test('pino exposes standard time functions', async (t) => {
  t.assert.ok(pino.stdTimeFunctions)
  t.assert.ok(pino.stdTimeFunctions.epochTime)
  t.assert.ok(pino.stdTimeFunctions.unixTime)
  t.assert.ok(pino.stdTimeFunctions.nullTime)
  t.assert.ok(pino.stdTimeFunctions.isoTime)
})

test('pino accepts external time functions', async (t) => {
  const opts = {
    timestamp: () => ',"time":"none"'
  }
  const stream = sink()
  const instance = pino(opts, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), true)
  t.assert.strictEqual(result.time, 'none')
})

test('pino accepts external time functions with custom label', async (t) => {
  const opts = {
    timestamp: () => ',"custom-time-label":"none"'
  }
  const stream = sink()
  const instance = pino(opts, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('custom-time-label'), true)
  t.assert.strictEqual(result['custom-time-label'], 'none')
})

test('inserts timestamp by default', async (t) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), true)
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than timestamp')
  t.assert.strictEqual(result.msg, 'foobar')
})

test('omits timestamp when timestamp option is false', async (t) => {
  const stream = sink()
  const instance = pino({ timestamp: false }, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), false)
  t.assert.strictEqual(result.msg, 'foobar')
})

test('inserts timestamp when timestamp option is true', async (t) => {
  const stream = sink()
  const instance = pino({ timestamp: true }, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), true)
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than timestamp')
  t.assert.strictEqual(result.msg, 'foobar')
})

test('child inserts timestamp by default', async (t) => {
  const stream = sink()
  const logger = pino(stream)
  const instance = logger.child({ component: 'child' })
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), true)
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than timestamp')
  t.assert.strictEqual(result.msg, 'foobar')
})

test('child omits timestamp with option', async (t) => {
  const stream = sink()
  const logger = pino({ timestamp: false }, stream)
  const instance = logger.child({ component: 'child' })
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), false)
  t.assert.strictEqual(result.msg, 'foobar')
})

test('pino.stdTimeFunctions.unixTime returns seconds based timestamps', async (t) => {
  const opts = {
    timestamp: pino.stdTimeFunctions.unixTime
  }
  const stream = sink()
  const instance = pino(opts, stream)
  const now = Date.now
  Date.now = () => 1531069919686
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), true)
  t.assert.strictEqual(result.time, 1531069920)
  Date.now = now
})

test('pino.stdTimeFunctions.isoTime returns ISO 8601 timestamps', async (t) => {
  const opts = {
    timestamp: pino.stdTimeFunctions.isoTime
  }
  const stream = sink()
  const instance = pino(opts, stream)
  const ms = 1531069919686
  const now = Date.now
  Date.now = () => ms
  const iso = new Date(ms).toISOString()
  instance.info('foobar')
  const result = await once(stream, 'data')
  t.assert.strictEqual(result.hasOwnProperty('time'), true)
  t.assert.strictEqual(result.time, iso)
  Date.now = now
})
