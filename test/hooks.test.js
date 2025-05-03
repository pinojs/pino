'use strict'

const { describe, test } = require('node:test')
const { sink, once } = require('./helper')
const pino = require('../')

function match (t, obj, expected) {
  const checkObj = Object.keys(expected).reduce((acc, key) => {
    acc[key] = obj[key]
    return acc
  }, {})

  t.assert.deepStrictEqual(checkObj, expected)
}

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
    match(t, await o, { msg: 'a-b-c' })
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
    match(t, await o, { msg: 'a' })
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
    match(t, await o, { msg: 'a-b' })

    o = once(stream, 'data')
    grandchild.info('c', 'd')
    match(t, await o, { msg: 'c-d' })
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
    match(t, await o, { msg: 'a' })
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
    match(t, await o, { msg: 'hide XXX in this string' })
  })
})
