'use strict'

const { test } = require('tap')
const pino = require('../')

test('can check if current level enabled', async ({ is }) => {
  const log = pino({ level: 'debug' })
  is(true, log.isLevelEnabled('debug'))
})

test('can check if level enabled after level set', async ({ is }) => {
  const log = pino()
  is(false, log.isLevelEnabled('debug'))
  log.level = 'debug'
  is(true, log.isLevelEnabled('debug'))
})

test('can check if higher level enabled', async ({ is }) => {
  const log = pino({ level: 'debug' })
  is(true, log.isLevelEnabled('error'))
})

test('can check if lower level is disabled', async ({ is }) => {
  const log = pino({ level: 'error' })
  is(false, log.isLevelEnabled('trace'))
})

test('can check if child has current level enabled', async ({ is }) => {
  const log = pino().child({ level: 'debug' })
  is(true, log.isLevelEnabled('debug'))
  is(true, log.isLevelEnabled('error'))
  is(false, log.isLevelEnabled('trace'))
})

test('can check if custom level is enabled', async ({ is }) => {
  const log = pino({
    customLevels: { foo: 35 },
    level: 'debug'
  })
  is(true, log.isLevelEnabled('foo'))
  is(true, log.isLevelEnabled('error'))
  is(false, log.isLevelEnabled('trace'))
})
