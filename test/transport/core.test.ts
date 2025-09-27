import test from 'node:test'
import assert from 'node:assert'
import * as os from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import fs from 'node:fs'
import * as url from 'node:url'
import { default as strip } from 'strip-ansi'
import execa from 'execa'
import writer from 'flush-write-stream'

import { watchFileCreated } from '../helper'
import pino from '../../'

if (process.platform === 'win32') {
  // TODO: Implement .ts files loading support for Windows
  process.exit()
}

const readFile = fs.promises.readFile
const { pid } = process
const hostname = os.hostname()

test('pino.transport with file', async (t) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts'),
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with file (no options + error handling)', async () => {
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts')
  })
  const [err] = await once(transport, 'error')
  assert.equal(err.message, 'kaboom')
})

test('pino.transport with file URL', async (t) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    target: url.pathToFileURL(join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts')).href,
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with two files', async (t) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    targets: [{
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts'),
      options: { destination: dest1 }
    }, {
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts'),
      options: { destination: dest2 }
    }]
  })

  t.after(transport.end.bind(transport))

  const instance = pino(transport)
  instance.info('hello')

  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])

  const result1 = JSON.parse(await readFile(dest1, { encoding: 'utf8' }))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2, { encoding: 'utf8' }))
  delete result2.time
  assert.deepEqual(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('no transport.end()', async (t) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts'),
    options: { destination }
  })
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('autoEnd = false', async (t) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const count = process.listenerCount('exit')
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'ts', 'to-file-transport.ts'),
    options: { destination },
    worker: { autoEnd: false }
  })
  t.after(transport.end.bind(transport))
  await once(transport, 'ready')

  const instance = pino(transport)
  instance.info('hello')

  await watchFileCreated(destination)

  assert.equal(count, process.listenerCount('exit'))

  const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('stdout in worker', async () => {
  let actual = ''
  const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', 'transport-main.ts')])

  child.stdout?.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('log and exit on ready', async () => {
  let actual = ''
  const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', 'transport-exit-on-ready.ts')])

  child.stdout?.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('log and exit before ready', async () => {
  let actual = ''
  const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', 'transport-exit-immediately.ts')])

  child.stdout?.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('log and exit before ready with async dest', async () => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', 'transport-exit-immediately-with-async-dest.ts'), destination])

  await once(child, 'exit')

  const actual = await readFile(destination, { encoding: 'utf8' })

  assert.equal(strip(actual).match(/HELLO/) != null, true)
  assert.equal(strip(actual).match(/WORLD/) != null, true)
})

test('string integer destination', async () => {
  let actual = ''
  const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', 'transport-string-stdout.ts')])

  child.stdout?.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  assert.equal(strip(actual).match(/Hello/) != null, true)
})
