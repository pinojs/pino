'use strict'
const os = require('os')
const { join } = require('path')
const { readFileSync } = require('fs')
const { spawnSync } = require('child_process')
const { test, teardown, comment } = require('tap')
const { watchFileCreated } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()

const basicTransport = require.resolve('./fixtures/basic-transport.mjs')

spawnSync('npm', ['link', join(__dirname, 'fixtures', 'legacy-transport')])
teardown(() => {
  comment('teardown commencing, might take a little while')
  spawnSync('npm', ['unlink', 'legacy-transport'])
})

test('pino.transport - transport name must be supplied and be a string', async ({ throws }) => {
  throws(() => pino.transport())
  throws(() => pino.transport(22))
  throws(() => pino.transport({}))
  throws(() => pino.transport({ transport: {} }))
})

test('pino.transport basic (transport, opts)', async ({ same }) => {
  const tmp = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.transport(basicTransport, {
    dest: tmp
  }))
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport basic ({transport, ...opts})', async ({ same }) => {
  const tmp = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.transport({
    transport: basicTransport,
    dest: tmp
  }))
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport legacy natural flush', async ({ is }) => {
  const result = spawnSync(process.execPath, [join(__dirname, 'fixtures', 'legacy-transport-consumers/natural-flush.js')])
  is(result.stdout.toString(), '30:hello')
})

test('pino.transport legacy sync flush', async ({ is }) => {
  const result = spawnSync(process.execPath, [join(__dirname, 'fixtures', 'legacy-transport-consumers/sync-flush.js')])
  is(result.stdout.toString(), '30:hello')
})
