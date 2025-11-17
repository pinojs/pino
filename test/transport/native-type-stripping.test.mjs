import test from 'node:test'
import assert from 'node:assert'
import * as os from 'node:os'
import { join } from 'node:path'
import fs from 'node:fs'
import * as url from 'node:url'

import { watchFileCreated } from '../helper.js'

const readFile = fs.promises.readFile

const { pid } = process
const hostname = os.hostname()

// Check if Node.js supports native type stripping (Node.js 22+)
function supportsTypeStripping () {
  const major = parseInt(process.versions.node.split('.')[0], 10)
  return major >= 22
}

// Only run these tests on Node.js 22+
const skipTests = !supportsTypeStripping()
const skipMessage = 'Native TypeScript type stripping not supported (requires Node.js 22+)'

test('pino.transport with native TypeScript file', { skip: skipTests ? skipMessage : false }, async (t) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  // We need to dynamically import pino to ensure worker thread inherits flags
  const { default: pino } = await import('../../pino.js')

  const transport = pino.transport({
    target: join(import.meta.dirname || url.fileURLToPath(new URL('.', import.meta.url)), '..', 'fixtures', 'ts', 'to-file-transport-native.mts'),
    options: { destination }
  })

  t.after(() => {
    transport.end()
    try {
      fs.unlinkSync(destination)
    } catch {}
  })

  const instance = pino(transport)
  instance.info('hello from native TypeScript transport')

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
  delete result.time

  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello from native TypeScript transport'
  })
})

test('pino.transport with native TypeScript file URL', { skip: skipTests ? skipMessage : false }, async (t) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  const { default: pino } = await import('../../pino.js')

  const transport = pino.transport({
    target: url.pathToFileURL(join(import.meta.dirname || url.fileURLToPath(new URL('.', import.meta.url)), '..', 'fixtures', 'ts', 'to-file-transport-native.mts')).href,
    options: { destination }
  })

  t.after(() => {
    transport.end()
    try {
      fs.unlinkSync(destination)
    } catch {}
  })

  const instance = pino(transport)
  instance.info('hello from file URL transport')

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
  delete result.time

  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello from file URL transport'
  })
})

test('pino.transport with multiple native TypeScript targets', { skip: skipTests ? skipMessage : false }, async (t) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  const { default: pino } = await import('../../pino.js')
  const fixtureDir = join(import.meta.dirname || url.fileURLToPath(new URL('.', import.meta.url)), '..', 'fixtures', 'ts')

  const transport = pino.transport({
    targets: [{
      level: 'info',
      target: join(fixtureDir, 'to-file-transport-native.mts'),
      options: { destination: dest1 }
    }, {
      level: 'info',
      target: join(fixtureDir, 'to-file-transport-native.mts'),
      options: { destination: dest2 }
    }]
  })

  t.after(() => {
    transport.end()
    try {
      fs.unlinkSync(dest1)
      fs.unlinkSync(dest2)
    } catch {}
  })

  const instance = pino(transport)
  instance.info('hello from multiple targets')

  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])

  const result1 = JSON.parse(await readFile(dest1, { encoding: 'utf8' }))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello from multiple targets'
  })

  const result2 = JSON.parse(await readFile(dest2, { encoding: 'utf8' }))
  delete result2.time
  assert.deepEqual(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello from multiple targets'
  })
})
