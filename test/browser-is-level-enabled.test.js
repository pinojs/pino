'use strict'

const { describe, test } = require('node:test')
const assert = require('node:assert')
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
  test('can check if current level enabled', async () => {
    const log = pino({ level: 'debug' })
    assert.equal(true, log.isLevelEnabled('debug'))
  })

  test('can check if current level enabled when as object', async () => {
    const log = pino({ asObject: true, level: 'debug' })
    assert.equal(true, log.isLevelEnabled('debug'))
  })

  test('can check if level enabled after level set', async () => {
    const log = pino()
    assert.equal(false, log.isLevelEnabled('debug'))
    log.level = 'debug'
    assert.equal(true, log.isLevelEnabled('debug'))
  })

  test('can check if higher level enabled', async () => {
    const log = pino({ level: 'debug' })
    assert.equal(true, log.isLevelEnabled('error'))
  })

  test('can check if lower level is disabled', async () => {
    const log = pino({ level: 'error' })
    assert.equal(false, log.isLevelEnabled('trace'))
  })

  test('ASC: can check if child has current level enabled', async () => {
    const log = pino().child({}, { level: 'debug' })
    assert.equal(true, log.isLevelEnabled('debug'))
    assert.equal(true, log.isLevelEnabled('error'))
    assert.equal(false, log.isLevelEnabled('trace'))
  })

  test('can check if custom level is enabled', async () => {
    const log = pino({
      customLevels: { foo: 35 },
      level: 'debug'
    })
    assert.equal(true, log.isLevelEnabled('foo'))
    assert.equal(true, log.isLevelEnabled('error'))
    assert.equal(false, log.isLevelEnabled('trace'))
  })
})

describe('Custom levels suite', () => {
  test('can check if current level enabled', async () => {
    const log = pino({ level: 'debug', customLevels })
    assert.equal(true, log.isLevelEnabled('debug'))
  })

  test('can check if level enabled after level set', async () => {
    const log = pino({ customLevels })
    assert.equal(false, log.isLevelEnabled('debug'))
    log.level = 'debug'
    assert.equal(true, log.isLevelEnabled('debug'))
  })

  test('can check if higher level enabled', async () => {
    const log = pino({ level: 'debug', customLevels })
    assert.equal(true, log.isLevelEnabled('error'))
  })

  test('can check if lower level is disabled', async () => {
    const log = pino({ level: 'error', customLevels })
    assert.equal(false, log.isLevelEnabled('trace'))
  })

  test('can check if child has current level enabled', async () => {
    const log = pino().child({ customLevels }, { level: 'debug' })
    assert.equal(true, log.isLevelEnabled('debug'))
    assert.equal(true, log.isLevelEnabled('error'))
    assert.equal(false, log.isLevelEnabled('trace'))
  })

  test('can check if custom level is enabled', async () => {
    const log = pino({
      customLevels: { foo: 35, ...customLevels },
      level: 'debug'
    })
    assert.equal(true, log.isLevelEnabled('foo'))
    assert.equal(true, log.isLevelEnabled('error'))
    assert.equal(false, log.isLevelEnabled('trace'))
  })

  test('supports custom level with value 0 in setLevel and isLevelEnabled', async () => {
    const written = []
    const log = pino({
      customLevels: { verbose: 0 },
      level: 'verbose',
      browser: {
        write (obj) {
          written.push(obj)
        }
      }
    })
    assert.equal(log.level, 'verbose')
    assert.equal(log.levelVal, 0)
    assert.equal(log.isLevelEnabled('verbose'), true)
    assert.equal(log.isLevelEnabled('trace'), true)
    log.verbose('zero level message')
    assert.equal(written.length, 1)
    assert.equal(written[0].level, 0)
    assert.equal(written[0].msg, 'zero level message')

    log.level = 'info'
    assert.equal(log.isLevelEnabled('verbose'), false)
    log.level = 'silent'
    assert.equal(log.isLevelEnabled('verbose'), false)
    assert.equal(log.isLevelEnabled('fatal'), false)
  })
})
