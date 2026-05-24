'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { once } = require('node:events')
const { join } = require('node:path')
const { readFile, unlink } = require('node:fs').promises
const { promisify } = require('node:util')

const pino = require('../..')
const { watchFileCreated, watchForWrite, file } = require('../helper')

const { pid } = process
const hostname = os.hostname()

async function waitForReady (stream) {
  if (stream.ready) {
    return
  }
  await once(stream, 'ready')
}

test('thread-stream async flush', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination }
  })
  t.after(() => transport.end())
  const instance = pino(transport)
  instance.info('hello')

  assert.equal(instance.flush(), undefined)

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('thread-stream async flush should call the passed callback', async (t) => {
  const outputPath = join(os.tmpdir(), `pino-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  t.after(async () => {
    try {
      await unlink(outputPath)
    } catch {
    }
  })
  async function getOutputLogLines () {
    return (await readFile(outputPath)).toString().trim().split('\n').map(JSON.parse)
  }
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination: outputPath }
  })
  t.after(() => transport.end())
  const instance = pino(transport)
  const flushPromise = promisify(instance.flush).bind(instance)
  await waitForReady(transport)
  transport.ref()

  instance.info('hello')
  await flushPromise()
  await watchFileCreated(outputPath)

  const [firstFlushData] = await getOutputLogLines()

  assert.equal(firstFlushData.msg, 'hello')

  instance.info('world')

  await flushPromise()
  await watchForWrite(outputPath, 'world')

  // After flush, both messages should be present
  const afterSecondFlush = await getOutputLogLines()
  assert.equal(afterSecondFlush.length, 2)
  assert.equal(afterSecondFlush[1].msg, 'world')
})
