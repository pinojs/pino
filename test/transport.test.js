'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { test } = require('tap')
const { watchFileCreated } = require('./helper')
const pino = require('../')
const url = require('url')
const strip = require('strip-ansi')

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

test('pino.transport with esm', async ({ same }) => {
  const dest = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.transport(join(__dirname, 'fixtures', 'to-file-transport.mjs'), { dest }))
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

test('pino.transport with two files', async ({ same }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport([{
    level: 'info',
    module: join(__dirname, 'fixtures', 'to-file-transport.js'),
    opts: { dest: dest1 }
  }, {
    level: 'info',
    module: join(__dirname, 'fixtures', 'to-file-transport.js'),
    opts: { dest: dest2 }
  }])
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  same(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  same(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with two files', async ({ same }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport([{
    level: 'info',
    destination: dest1
  }, {
    level: 'info',
    destination: dest2
  }])
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  same(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  same(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with an array including a prettyPrint destination', async ({ same, match }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport([{
    level: 'info',
    destination: dest1
  }, {
    level: 'info',
    prettyPrint: true,
    destination: dest2
  }])
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  same(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const actual = (await readFile(dest2)).toString()
  match(strip(actual), /\[.*\] INFO.*hello/)
})
