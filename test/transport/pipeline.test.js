'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { once } = require('node:events')
const { join } = require('node:path')
const { readFile } = require('node:fs').promises
const { MessageChannel } = require('node:worker_threads')

const { watchFileCreated, file } = require('../helper')
const pino = require('../../')
const { DEFAULT_LEVELS } = require('../../lib/constants')

const { pid } = process
const hostname = os.hostname()

test('pino.transport with a pipeline', async (t) => {
  const destination = file()
  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
})

test('pino.transport with targets containing pipelines', async (t) => {
  const destinationA = file()
  const destinationB = file()
  const transport = pino.transport({
    targets: [
      {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: destinationA }
      },
      {
        pipeline: [
          {
            target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
          },
          {
            target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
            options: { destination: destinationB }
          }
        ]
      }
    ]
  })

  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destinationA)
  await watchFileCreated(destinationB)
  const resultA = JSON.parse(await readFile(destinationA))
  const resultB = JSON.parse(await readFile(destinationB))
  delete resultA.time
  delete resultB.time
  assert.deepEqual(resultA, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello'
  })
  assert.deepEqual(resultB, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
})

test('pino.transport with targets containing pipelines with levels defined and dedupe', async (t) => {
  const destinationA = file()
  const destinationB = file()
  const transport = pino.transport({
    targets: [
      {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: destinationA },
        level: DEFAULT_LEVELS.info
      },
      {
        pipeline: [
          {
            target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
          },
          {
            target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
            options: { destination: destinationB }
          }
        ],
        level: DEFAULT_LEVELS.error
      }
    ],
    dedupe: true
  })

  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello info')
  instance.error('hello error')
  await watchFileCreated(destinationA)
  await watchFileCreated(destinationB)
  const resultA = JSON.parse(await readFile(destinationA))
  const resultB = JSON.parse(await readFile(destinationB))
  delete resultA.time
  delete resultB.time
  assert.deepEqual(resultA, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello info'
  })
  assert.deepEqual(resultB, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.error,
    msg: 'hello error',
    service: 'pino' // this property was added by the transform
  })
})

test('pino.transport pipeline passes per-stage worker options with transferables (#1856)', async (t) => {
  const destination = file()
  const { port1, port2 } = new MessageChannel()
  const message = once(port2, 'message')
  t.after(() => port2.close())

  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-pipeline-worker-options.js'),
      worker: {
        workerData: { port: port1, value: 'worker options' },
        transferList: [port1]
      }
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')

  const [received] = await message
  assert.deepEqual(received, { value: 'worker options' })

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello',
    workerValue: 'worker options'
  })
})

test('pino.transport pipeline passes per-stage workerData without transferables (#1856)', async (t) => {
  const destination = file()

  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-pipeline-worker-options.js'),
      worker: { workerData: { value: 'plain data' } }
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello',
    workerValue: 'plain data'
  })
})

test('pino.transport merges transferLists from stages across pipelines (#1856)', async (t) => {
  const destinationA = file()
  const destinationB = file()
  const channelA = new MessageChannel()
  const channelB = new MessageChannel()
  const messageA = once(channelA.port2, 'message')
  const messageB = once(channelB.port2, 'message')
  t.after(() => {
    channelA.port2.close()
    channelB.port2.close()
  })

  const transport = pino.transport({
    targets: [
      {
        pipeline: [{
          target: join(__dirname, '..', 'fixtures', 'transport-pipeline-worker-options.js'),
          worker: {
            workerData: { port: channelA.port1, value: 'pipe-a' },
            transferList: [channelA.port1]
          }
        }, {
          target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
          options: { destination: destinationA }
        }]
      },
      {
        pipeline: [{
          target: join(__dirname, '..', 'fixtures', 'transport-pipeline-worker-options.js'),
          worker: {
            workerData: { port: channelB.port1, value: 'pipe-b' },
            transferList: [channelB.port1]
          }
        }, {
          target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
          options: { destination: destinationB }
        }]
      }
    ]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')

  const [receivedA] = await messageA
  const [receivedB] = await messageB
  assert.deepEqual(receivedA, { value: 'pipe-a' })
  assert.deepEqual(receivedB, { value: 'pipe-b' })

  await watchFileCreated(destinationA)
  await watchFileCreated(destinationB)
  for (const [destination, workerValue] of [[destinationA, 'pipe-a'], [destinationB, 'pipe-b']]) {
    const result = JSON.parse(await readFile(destination))
    delete result.time
    assert.deepEqual(result, {
      pid,
      hostname,
      level: DEFAULT_LEVELS.info,
      msg: 'hello',
      workerValue
    })
  }
})

test('pino.transport dedupes transferList entries shared by top level and stages (#1856)', async (t) => {
  const destination = file()
  const { port1, port2 } = new MessageChannel()
  const message = once(port2, 'message')
  t.after(() => port2.close())

  const transport = pino.transport({
    worker: { transferList: [port1] },
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-pipeline-worker-options.js'),
      worker: {
        workerData: { port: port1, value: 'deduped' },
        transferList: [port1]
      }
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')

  const [received] = await message
  assert.deepEqual(received, { value: 'deduped' })

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello',
    workerValue: 'deduped'
  })
})

test('pino.transport targets containing pipelines pass per-stage worker options (#1856)', async (t) => {
  const destination = file()
  const { port1, port2 } = new MessageChannel()
  const message = once(port2, 'message')
  t.after(() => port2.close())

  const transport = pino.transport({
    targets: [{
      pipeline: [{
        target: join(__dirname, '..', 'fixtures', 'transport-pipeline-worker-options.js'),
        worker: {
          workerData: { port: port1, value: 'targets pipeline' },
          transferList: [port1]
        }
      }, {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination }
      }]
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')

  const [received] = await message
  assert.deepEqual(received, { value: 'targets pipeline' })

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: DEFAULT_LEVELS.info,
    msg: 'hello',
    workerValue: 'targets pipeline'
  })
})
