import * as os from 'os'
import { join } from 'path'
import { once } from 'events'
import fs from 'fs'
import { watchFileCreated } from '../helper'
import { test } from 'tap'
import pino from '../../'
import * as url from 'url'
import { default as strip } from 'strip-ansi'
import execa from 'execa'
import writer from 'flush-write-stream'

const readFile = fs.promises.readFile

const { pid } = process
const hostname = os.hostname()

function runTests(esVersion: string): void {
  test(`(ts -> ${esVersion}) pino.transport with file`, async ({ same, teardown }) => {
    const destination = join(
      os.tmpdir(),
      '_' + Math.random().toString(36).substr(2, 9)
    )
    const transport = pino.transport({
      target: join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`),
      options: { destination }
    })
    teardown(transport.end.bind(transport))
    const instance = pino(transport)
    instance.info('hello')
    await watchFileCreated(destination)
    const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
    delete result.time
    same(result, {
      pid,
      hostname,
      level: 30,
      msg: 'hello'
    })
  })

  test(`(ts -> ${esVersion}) pino.transport with file (no options + error handling)`, async ({ equal }) => {
    const transport = pino.transport({
      target: join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`)
    })
    const [err] = await once(transport, 'error')
    equal(err.message, 'kaboom')
  })

  test(`(ts -> ${esVersion}) pino.transport with file URL`, async ({ same, teardown }) => {
    const destination = join(
      os.tmpdir(),
      '_' + Math.random().toString(36).substr(2, 9)
    )
    const transport = pino.transport({
      target: url.pathToFileURL(join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`)).href,
      options: { destination }
    })
    teardown(transport.end.bind(transport))
    const instance = pino(transport)
    instance.info('hello')
    await watchFileCreated(destination)
    const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
    delete result.time
    same(result, {
      pid,
      hostname,
      level: 30,
      msg: 'hello'
    })
  })

  test(`(ts -> ${esVersion}) pino.transport with two files`, async ({ same, teardown }) => {
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
        target: join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`),
        options: { destination: dest1 }
      }, {
        level: 'info',
        target: join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`),
        options: { destination: dest2 }
      }]
    })

    teardown(transport.end.bind(transport))

    const instance = pino(transport)
    instance.info('hello')

    await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])

    const result1 = JSON.parse(await readFile(dest1, { encoding: 'utf8' }))
    delete result1.time
    same(result1, {
      pid,
      hostname,
      level: 30,
      msg: 'hello'
    })
    const result2 = JSON.parse(await readFile(dest2, { encoding: 'utf8' }))
    delete result2.time
    same(result2, {
      pid,
      hostname,
      level: 30,
      msg: 'hello'
    })
  })

  test(`(ts -> ${esVersion}) no transport.end()`, async ({ same, teardown }) => {
    const destination = join(
      os.tmpdir(),
      '_' + Math.random().toString(36).substr(2, 9)
    )
    const transport = pino.transport({
      target: join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`),
      options: { destination }
    })
    const instance = pino(transport)
    instance.info('hello')
    await watchFileCreated(destination)
    const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
    delete result.time
    same(result, {
      pid,
      hostname,
      level: 30,
      msg: 'hello'
    })
  })

  test(`(ts -> ${esVersion}) autoEnd = false`, async ({ equal, same, teardown }) => {
    const destination = join(
      os.tmpdir(),
      '_' + Math.random().toString(36).substr(2, 9)
    )
    const count = process.listenerCount('exit')
    const transport = pino.transport({
      target: join(__dirname, '..', 'fixtures', 'ts', `to-file-transport.${esVersion}.cjs`),
      options: { destination },
      worker: { autoEnd: false }
    })
    teardown(transport.end.bind(transport))
    await once(transport, 'ready')

    const instance = pino(transport)
    instance.info('hello')

    await watchFileCreated(destination)

    equal(count, process.listenerCount('exit'))

    const result = JSON.parse(await readFile(destination, { encoding: 'utf8' }))
    delete result.time
    same(result, {
      pid,
      hostname,
      level: 30,
      msg: 'hello'
    })
  })

  test(`(ts -> ${esVersion}) stdout in worker`, async ({ not }) => {
    let actual = ''
    const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', `transport-main.${esVersion}.cjs`)])

    child.stdout?.pipe(writer((s, enc, cb) => {
      actual += s
      cb()
    }))
    await once(child, 'close')
    not(strip(actual).match(/Hello/), null)
  })

  test(`(ts -> ${esVersion}) log and exit on ready`, async ({ not }) => {
    let actual = ''
    const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', `transport-exit-on-ready.${esVersion}.cjs`)])

    child.stdout?.pipe(writer((s, enc, cb) => {
      actual += s
      cb()
    }))
    await once(child, 'close')
    not(strip(actual).match(/Hello/), null)
  })

  test(`(ts -> ${esVersion}) log and exit before ready`, async ({ not }) => {
    let actual = ''
    const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', `transport-exit-immediately.${esVersion}.cjs`)])

    child.stdout?.pipe(writer((s, enc, cb) => {
      actual += s
      cb()
    }))
    await once(child, 'close')
    not(strip(actual).match(/Hello/), null)
  })

  test(`(ts -> ${esVersion}) log and exit before ready with async dest`, async ({ not }) => {
    const destination = join(
      os.tmpdir(),
      '_' + Math.random().toString(36).substr(2, 9)
    )
    const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', `transport-exit-immediately-with-async-dest.${esVersion}.cjs`), destination])

    await once(child, 'exit')

    const actual = await readFile(destination, { encoding: 'utf8' })

    not(strip(actual).match(/HELLO/), null)
    not(strip(actual).match(/WORLD/), null)
  })

  test(`(ts -> ${esVersion}) string integer destination`, async ({ not }) => {
    let actual = ''
    const child = execa(process.argv[0], ['-r', 'ts-node/register', join(__dirname, '..', 'fixtures', 'ts', `transport-string-stdout.${esVersion}.cjs`)])

    child.stdout?.pipe(writer((s, enc, cb) => {
      actual += s
      cb()
    }))
    await once(child, 'close')
    not(strip(actual).match(/Hello/), null)
  })
}

runTests('es5')
runTests('es6')
runTests('es2017')
runTests('esnext')
