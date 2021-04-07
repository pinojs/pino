'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { test } = require('tap')
const { watchFileCreated } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()

test('pino.transport with file', async ({ same }) => {
  const dest = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.transport(join(__dirname, 'fixtures', 'to-file-transport.js'), { dest }))
  instance.info('hello')
  await watchFileCreated(dest)
  const result = JSON.parse(await readFile(dest))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})
