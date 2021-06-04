'use strict'

const os = require('os')
const { join } = require('path')
const { once } = require('events')
const { readFile, symlink, unlink } = require('fs').promises
const { test } = require('tap')
const { isWin, watchFileCreated } = require('./helper')
const pino = require('../')
const url = require('url')
const strip = require('strip-ansi')

const { pid } = process
const hostname = os.hostname()

test('pino.transport with file', async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    src: join(__dirname, 'fixtures', 'to-file-transport.js'),
    opts: { destination }
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
    msg: 'hello'
  })
})

test('pino.transport with file (no options + error handling)', async ({ equal }) => {
  const transport = pino.transport({
    src: join(__dirname, 'fixtures', 'to-file-transport.js')
  })
  // TODO: when thread stream passess error handling to main, mop up the console.error
  const [err] = await once(transport, 'error')
  equal(err.message, 'kaboom')
})

// TODO make this test pass on Windows
test('pino.transport with package', { skip: isWin }, async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  try {
    await unlink(join(__dirname, '..', 'node_modules', 'transport'))
  } catch {}

  await symlink(
    join(__dirname, 'fixtures', 'transport'),
    join(__dirname, '..', 'node_modules', 'transport')
  )

  const transport = pino.transport({
    module: 'transport',
    opts: { destination }
  })
  teardown(async () => {
    await unlink(join(__dirname, '..', 'node_modules', 'transport'))
    transport.end()
  })
  const instance = pino(transport)
  instance.info('hello')
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

test('pino.transport with file URL', async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    src: url.pathToFileURL(join(__dirname, 'fixtures', 'to-file-transport.js')).href,
    opts: { destination }
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
    msg: 'hello'
  })
})

test('pino.transport errors if file does not exists', ({ plan, pass }) => {
  plan(1)
  const instance = pino.transport({
    src: join(__dirname, 'fixtures', 'non-existent-file'),
    workerOpts: {
      stdin: true,
      stdout: true,
      stderr: true
    }
  })
  instance.on('error', function () {
    pass('error received')
  })
})

test('pino.transport with esm', async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    src: join(__dirname, 'fixtures', 'to-file-transport.mjs'),
    opts: { destination }
  })
  const instance = pino(transport)
  teardown(transport.end.bind(transport))
  instance.info('hello')
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

test('pino.transport with two files', async ({ same, teardown }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    destinations: [{
      level: 'info',
      src: join(__dirname, 'fixtures', 'to-file-transport.js'),
      opts: { destination: dest1 }
    }, {
      level: 'info',
      src: join(__dirname, 'fixtures', 'to-file-transport.js'),
      opts: { destination: dest2 }
    }]
  })
  teardown(transport.end.bind(transport))
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

test('pino.transport with an array including a prettyPrint destination', async ({ same, match, teardown }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    destinations: [{
      level: 'info',
      destination: dest1
    }, {
      level: 'info',
      prettyPrint: true,
      destination: dest2
    }]
  })
  teardown(transport.end.bind(transport))
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

test('no transport.end()', async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    src: join(__dirname, 'fixtures', 'to-file-transport.js'),
    opts: { destination }
  })
  const instance = pino(transport)
  instance.info('hello')
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

test('autoEnd = false', async ({ equal, same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const count = process.listenerCount('exit')
  const transport = pino.transport({
    src: join(__dirname, 'fixtures', 'to-file-transport.js'),
    opts: { destination },
    workerOpts: { autoEnd: false }
  })
  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)

  equal(count, process.listenerCount('exit'))

  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with src and destinations', async ({ fail, equal }) => {
  try {
    pino.transport({
      src: 'a/file',
      destinations: [{
        src: 'a/file'
      }]
    })
    fail('must throw')
  } catch (err) {
    equal(err.message, 'Only one of src, destinations or module can be specified')
  }
})

test('pino.transport with src and module', async ({ fail, equal }) => {
  try {
    pino.transport({
      src: 'a/file',
      module: 'transport'
    })
    fail('must throw')
  } catch (err) {
    equal(err.message, 'Only one of src, destinations or module can be specified')
  }
})

test('pino.transport with destinations and module', async ({ fail, equal }) => {
  try {
    pino.transport({
      destinations: [{
        src: 'a/file'
      }],
      module: 'transport'
    })
    fail('must throw')
  } catch (err) {
    equal(err.message, 'Only one of src, destinations or module can be specified')
  }
})

// TODO make this test pass on Windows
test('pino.transport with package as a destination', { skip: isWin }, async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  try {
    await unlink(join(__dirname, '..', 'node_modules', 'transport'))
  } catch {}

  await symlink(
    join(__dirname, 'fixtures', 'transport'),
    join(__dirname, '..', 'node_modules', 'transport')
  )

  const transport = pino.transport({
    destinations: [{
      module: 'transport',
      opts: { destination }
    }]
  })
  teardown(async () => {
    await unlink(join(__dirname, '..', 'node_modules', 'transport'))
    transport.end()
  })
  const instance = pino(transport)
  instance.info('hello')
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
