'use strict'

/* eslint no-prototype-builtins: 0 */

const { test } = require('tap')
const { sink, once } = require('./helper')

test('pino.stdTimeFunctions.isoTimeNanos returns RFC 3339 timestamps', async ({ equal }) => {
  const ms = 1754060611115
  const now = Date.now
  Date.now = () => ms

  const hrTimeBigint = process.hrtime.bigint
  process.hrtime.bigint = () => 101794177055958n

  const pino = require('../')

  const opts = {
    timestamp: pino.stdTimeFunctions.isoTimeNanos
  }
  const stream = sink()
  process.hrtime.bigint = () => 101808350592625n
  const instance = pino(opts, stream)
  instance.info('foobar')
  const result = await once(stream, 'data')
  equal(result.hasOwnProperty('time'), true)
  equal(result.time, '2025-08-01T15:03:45.288536667Z')
  Date.now = now
  process.hrtime.bigint = hrTimeBigint
})
