'use strict'

const { test, describe } = require('node:test')
const pino = require('../')

const descLevels = {
  trace: 60,
  debug: 50,
  info: 40,
  warn: 30,
  error: 20,
  fatal: 10
}

const ascLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
}

describe('Default levels suite', () => {
  test('can check if current level enabled', async (t) => {
    const log = pino({ level: 'debug' })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if level enabled after level set', async (t) => {
    const log = pino()
    t.assert.strictEqual(false, log.isLevelEnabled('debug'))
    log.level = 'debug'
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if higher level enabled', async (t) => {
    const log = pino({ level: 'debug' })
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
  })

  test('can check if lower level is disabled', async (t) => {
    const log = pino({ level: 'error' })
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('ASC: can check if child has current level enabled', async (t) => {
    const log = pino().child({}, { level: 'debug' })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if custom level is enabled', async (t) => {
    const log = pino({
      customLevels: { foo: 35 },
      level: 'debug'
    })
    t.assert.strictEqual(true, log.isLevelEnabled('foo'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })
})

describe('Ascending levels suite', () => {
  const customLevels = ascLevels
  const levelComparison = 'ASC'

  test('can check if current level enabled', async (t) => {
    const log = pino({ level: 'debug', levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if level enabled after level set', async (t) => {
    const log = pino({ levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(false, log.isLevelEnabled('debug'))
    log.level = 'debug'
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if higher level enabled', async (t) => {
    const log = pino({ level: 'debug', levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
  })

  test('can check if lower level is disabled', async (t) => {
    const log = pino({ level: 'error', customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if child has current level enabled', async (t) => {
    const log = pino().child({ levelComparison, customLevels, useOnlyCustomLevels: true }, { level: 'debug' })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if custom level is enabled', async (t) => {
    const log = pino({
      levelComparison,
      useOnlyCustomLevels: true,
      customLevels: { foo: 35, ...customLevels },
      level: 'debug'
    })
    t.assert.strictEqual(true, log.isLevelEnabled('foo'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })
})

describe('Descending levels suite', () => {
  const customLevels = descLevels
  const levelComparison = 'DESC'

  test('can check if current level enabled', async (t) => {
    const log = pino({ level: 'debug', levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if level enabled after level set', async (t) => {
    const log = pino({ levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(false, log.isLevelEnabled('debug'))
    log.level = 'debug'
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if higher level enabled', async (t) => {
    const log = pino({ level: 'debug', levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
  })

  test('can check if lower level is disabled', async (t) => {
    const log = pino({ level: 'error', levelComparison, customLevels, useOnlyCustomLevels: true })
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if child has current level enabled', async (t) => {
    const log = pino({ levelComparison, customLevels, useOnlyCustomLevels: true }).child({}, { level: 'debug' })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if custom level is enabled', async (t) => {
    const log = pino({
      levelComparison,
      customLevels: { foo: 35, ...customLevels },
      useOnlyCustomLevels: true,
      level: 'debug'
    })
    t.assert.strictEqual(true, log.isLevelEnabled('foo'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })
})

describe('Custom levels comparison', async () => {
  test('Custom comparison returns true cause level is enabled', async (t) => {
    const log = pino({ level: 'error', levelComparison: () => true })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('Custom comparison returns false cause level is disabled', async (t) => {
    const log = pino({ level: 'error', levelComparison: () => false })
    t.assert.strictEqual(false, log.isLevelEnabled('debug'))
  })

  test('Custom comparison returns true cause child level is enabled', async (t) => {
    const log = pino({ levelComparison: () => true }).child({ level: 'error' })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('Custom comparison returns false cause child level is disabled', async (t) => {
    const log = pino({ levelComparison: () => false }).child({ level: 'error' })
    t.assert.strictEqual(false, log.isLevelEnabled('debug'))
  })
})
