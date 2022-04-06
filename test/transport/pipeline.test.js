'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { watchFileCreated, file } = require('../helper')
const { test } = require('tap')
const pino = require('../../')

const { pid } = process
const hostname = os.hostname()

test('pino.transport with a pipeline', async ({ same, teardown }) => {
  const destination = file()
  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
})
