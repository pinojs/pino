'use strict'

const tap = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

tap.test('log method hook', t => {
  t.test('gets invoked', async t => {
    t.plan(6)

    const stream = sink()
    const logger = pino({
      hooks: {
        logMethod (args, method) {
          t.type(args, Array)
          t.is(args.length, 3)
          t.deepEqual(args, ['a', 'b', 'c'])

          t.type(method, Function)
          t.is(method.name, 'LOG')

          method.apply(this, [args.join('-')])
        }
      }
    }, stream)

    const o = once(stream, 'data')
    logger.info('a', 'b', 'c')
    t.match(await o, { msg: 'a-b-c' })
  })

  t.test('fatal method invokes hook', async t => {
    t.plan(2)

    const stream = sink()
    const logger = pino({
      hooks: {
        logMethod (args, method) {
          t.pass()
          method.apply(this, [args.join('-')])
        }
      }
    }, stream)

    const o = once(stream, 'data')
    logger.fatal('a')
    t.match(await o, { msg: 'a' })
  })

  t.end()
})
