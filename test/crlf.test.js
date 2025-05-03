'use strict'

const { test } = require('node:test')
const writer = require('flush-write-stream')
const pino = require('../')

function capture () {
  const ws = writer((chunk, enc, cb) => {
    ws.data += chunk.toString()
    cb()
  })
  ws.data = ''
  return ws
}

test('pino uses LF by default', async (t) => {
  const stream = capture()
  const logger = pino(stream)
  logger.info('foo')
  logger.error('bar')
  t.assert.ok(/foo[^\r\n]+\n[^\r\n]+bar[^\r\n]+\n/.test(stream.data))
})

test('pino can log CRLF', async (t) => {
  const stream = capture()
  const logger = pino({
    crlf: true
  }, stream)
  logger.info('foo')
  logger.error('bar')
  t.assert.ok(/foo[^\n]+\r\n[^\n]+bar[^\n]+\r\n/.test(stream.data))
})
