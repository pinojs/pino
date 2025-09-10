'use strict'

const test = require('node:test')
const os = require('node:os')
const diagChan = require('node:diagnostics_channel')
const { Writable } = require('node:stream')
const tspl = require('@matteo.collina/tspl')
const pino = require('../pino')

const hostname = os.hostname()
const { pid } = process

test.beforeEach(ctx => {
  ctx.pino = {
    ts: 1757512800000, // 2025-09-10T10:00:00.000-05:00
    now: Date.now
  }

  Date.now = () => ctx.pino.ts
})

test.afterEach(ctx => {
  Date.now = ctx.pino.now
})

test('asJson emits events', async (t) => {
  const plan = tspl(t, { plan: 5 })
  const dest = new Writable({
    objectMode: true,
    write (data, enc, cb) {
      cb()
    }
  })
  const expectedArguments = [
    {},
    'testing',
    30,
    `,"time":${t.pino.ts}`
  ]

  diagChan.subscribe('tracing:pino_asJson:start', (event) => {
    plan.equal(Object.prototype.toString.call(event.instance), '[object Pino]')
    plan.deepStrictEqual(Array.from(event.arguments ?? []), expectedArguments)
  })

  diagChan.subscribe('tracing:pino_asJson:end', (event) => {
    plan.equal(Object.prototype.toString.call(event.instance), '[object Pino]')
    plan.deepStrictEqual(Array.from(event.arguments ?? []), expectedArguments)
    plan.equal(
      event.line,
        `{"level":30,"time":${t.pino.ts},"pid":${pid},"hostname":"${hostname}","msg":"testing"}\n`
    )
  })

  const logger = pino({}, dest)
  logger.info('testing')
  await plan
})
