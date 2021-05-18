'use strict'
/* eslint no-prototype-builtins: 0 */

const { test } = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

process.removeAllListeners('warning')

test('useLevelLabels', async ({ match, equal }) => {
  process.on('warning', onWarning)
  function onWarning (warn) {
    equal(warn.code, 'PINODEP001')
  }

  const stream = sink()
  const logger = pino({
    useLevelLabels: true
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, { level: 'info' })
  process.removeListener('warning', onWarning)
})

test('changeLevelName', async ({ match, equal }) => {
  process.on('warning', onWarning)
  function onWarning (warn) {
    equal(warn.code, 'PINODEP002')
  }

  const stream = sink()
  const logger = pino({
    changeLevelName: 'priority'
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, { priority: 30 })
  process.removeListener('warning', onWarning)
})

test('levelKey', async ({ match, equal }) => {
  process.on('warning', onWarning)
  function onWarning (warn) {
    equal(warn.code, 'PINODEP002')
  }

  const stream = sink()
  const logger = pino({
    levelKey: 'priority'
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, { priority: 30 })
  process.removeListener('warning', onWarning)
})

test('useLevelLabels and changeLevelName', async ({ match, equal }) => {
  let count = 0
  process.on('warning', onWarning)
  function onWarning (warn) {
    equal(warn.code, count === 0 ? 'PINODEP001' : 'PINODEP002')
    count += 1
  }

  const stream = sink()
  const logger = pino({
    changeLevelName: 'priority',
    useLevelLabels: true
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, { priority: 'info' })
  process.removeListener('warning', onWarning)
})

test('pino.* serializer', async ({ match, equal, pass }) => {
  process.on('warning', onWarning)
  function onWarning (warn) {
    equal(warn.code, 'PINODEP003')
  }

  const stream = sink()
  const logger = pino({
    serializers: {
      [Symbol.for('pino.*')] (log) {
        pass('called')
        return log
      }
    }
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, { level: 30 })
  process.removeListener('warning', onWarning)
})
