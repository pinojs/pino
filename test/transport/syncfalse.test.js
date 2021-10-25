'use strict'

const pino = require('../..')
const { join } = require('path')
const { test } = require('tap')

test('thread-stream async flush', async () => {
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'console-transport.js')
  })
  const instance = pino(transport)
  instance.info('hello')
  instance.flush()
})
