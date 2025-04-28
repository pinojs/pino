'use strict'

const { test, describe } = require('node:test')
const pino = require('../browser')

const customLevels = {
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

  test('can check if current level enabled when as object', async (t) => {
    const log = pino({ asObject: true, level: 'debug' })
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

describe('Custom levels suite', () => {
  test('can check if current level enabled', async (t) => {
    const log = pino({ level: 'debug', customLevels })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if level enabled after level set', async (t) => {
    const log = pino({ customLevels })
    t.assert.strictEqual(false, log.isLevelEnabled('debug'))
    log.level = 'debug'
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
  })

  test('can check if higher level enabled', async (t) => {
    const log = pino({ level: 'debug', customLevels })
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
  })

  test('can check if lower level is disabled', async (t) => {
    const log = pino({ level: 'error', customLevels })
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if child has current level enabled', async (t) => {
    const log = pino().child({ customLevels }, { level: 'debug' })
    t.assert.strictEqual(true, log.isLevelEnabled('debug'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })

  test('can check if custom level is enabled', async (t) => {
    const log = pino({
      customLevels: { foo: 35, ...customLevels },
      level: 'debug'
    })
    t.assert.strictEqual(true, log.isLevelEnabled('foo'))
    t.assert.strictEqual(true, log.isLevelEnabled('error'))
    t.assert.strictEqual(false, log.isLevelEnabled('trace'))
  })
})
