'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { test, teardown, comment } = require('tap')
const { spawnSync } = require('child_process')
const { watchFileCreated } = require('./helper')
const pino = require('../')
const url = require('url')

const { pid } = process
const hostname = os.hostname()

comment('linkining commencing, might take a little while')
spawnSync('npm', ['link', join(__dirname, 'fixtures', 'transport')])
teardown(() => {
  comment('teardown commencing, might take a little while')
  spawnSync('npm', ['unlink', 'transport'])
})

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

test('pino.transport with package', { skip: process.platform === 'win32' }, async ({ same }) => {
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
