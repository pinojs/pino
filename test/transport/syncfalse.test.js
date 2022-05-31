'use strict'

const os = require('os')
const pino = require('../..')
const { join } = require('path')
const { test } = require('tap')
const { readFile } = require('fs').promises
const { watchFileCreated, file } = require('../helper')

const { pid } = process
const hostname = os.hostname()

test('thread-stream async flush', async ({ same }) => {
  const destination = file()
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination }
  })
  const instance = pino(transport)
  instance.info('hello')
  instance.flush()
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})
