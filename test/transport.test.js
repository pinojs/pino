'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { test } = require('tap')
const { watchFileCreated } = require('./helper')
const pino = require('../')
const url = require('url')

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

test('pino.transport with package', async ({ same }) => {
  const dest = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.transport('transport', { dest }))
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

test('pino.transport with file URL', async ({ same }) => {
  const dest = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.transport(url.pathToFileURL(join(__dirname, 'fixtures', 'to-file-transport.js')).href, { dest }))
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

test('pino.transport errors if file does not exists', ({ plan, pass }) => {
  plan(1)
  const instance = pino.transport(join(__dirname, 'fixtures', 'non-existent-file'), {}, {
    stdin: true,
    stdout: true,
    stderr: true
  })
  instance.on('error', function () {
    pass('error received')
  })
})
