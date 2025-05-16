'use strict'

const { describe, test } = require('node:test')
const match = require('@jsumners/assert-match')
const { sink, once } = require('./helper')
const pino = require('../')

describe('log method hook', () => {
  test('gets invoked', async t => {
    t.plan(8)

    const stream = sink()
    const logger = pino({
      hooks: {
        logMethod (args, method, level) {
          t.assert.ok(Array.isArray(args), 'args is not an array type')
          t.assert.ok(typeof level === 'number', 'lever is not of type number')
          t.assert.strictEqual(args.length, 3)
          t.assert.strictEqual(level, this.levels.values.info)
          t.assert.deepStrictEqual(args, ['a', 'b', 'c'])

          t.assert.ok(typeof method === 'function', 'method is not of type function')
          t.assert.strictEqual(method.name, 'LOG')

          method.apply(this, [args.join('-')])
        }
      }
    }, stream)

    const o = once(stream, 'data')
    logger.info('a', 'b', 'c')
    match(await o, { msg: 'a-b-c' }, t)
  })

  test('fatal method invokes hook', async t => {
    t.plan(2)

    const stream = sink()
    const logger = pino({
      hooks: {
        logMethod (args, method) {
          t.assert.ok(true)
          method.apply(this, [args.join('-')])
        }
      }
    }, stream)

    const o = once(stream, 'data')
    logger.fatal('a')
    match(await o, { msg: 'a' }, t)
  })

  test('children get the hook', async t => {
    t.plan(4)

    const stream = sink()
    const root = pino({
      hooks: {
        logMethod (args, method) {
          t.assert.ok(true)
          method.apply(this, [args.join('-')])
        }
      }
    }, stream)
    const child = root.child({ child: 'one' })
    const grandchild = child.child({ child: 'two' })

    let o = once(stream, 'data')
    child.info('a', 'b')
    match(await o, { msg: 'a-b' }, t)

    o = once(stream, 'data')
    grandchild.info('c', 'd')
    match(await o, { msg: 'c-d' }, t)
  })

  test('get log level', async t => {
    t.plan(3)

    const stream = sink()
    const logger = pino({
      hooks: {
        logMethod (args, method, level) {
          t.assert.ok(typeof level === 'number', 'level is not of type number')
          t.assert.strictEqual(level, this.levels.values.error)

          method.apply(this, [args.join('-')])
        }
      }
    }, stream)

    const o = once(stream, 'data')
    logger.error('a')
    match(await o, { msg: 'a' }, t)
  })
})

describe('streamWrite hook', () => {
  test('gets invoked', async t => {
    t.plan(1)

    const stream = sink()
    const logger = pino({
      hooks: {
        streamWrite (s) {
          return s.replaceAll('redact-me', 'XXX')
        }
      }
    }, stream)

    const o = once(stream, 'data')
    logger.info('hide redact-me in this string')
    match(await o, { msg: 'hide XXX in this string' }, t)
  })
})
