'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { join } = require('node:path')
const { readFile } = require('node:fs').promises
const { promisify } = require('node:util')
const { once } = require('node:events')

const pino = require('../..')
const { watchFileCreated, watchForWrite, file } = require('../helper')

const { pid } = process
const hostname = os.hostname()

test('thread-stream async flush', async () => {
  const destination = file()
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination }
  })
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

test('thread-stream async flush should call the passed callback', async () => {
  const outputPath = file()
  async function getOutputLogLines () {
    return (await readFile(outputPath)).toString().trim().split('\n').map(JSON.parse)
  }
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination: outputPath }
  })
  const instance = pino(transport)
  const flushPromise = promisify(instance.flush).bind(instance)

  // The worker thread backing the transport is unref'd once it becomes ready
  // (see lib/transport.js) so it does not keep the process alive. Because this
  // test awaits `flush()` on an otherwise idle event loop, re-ref the worker
  // after it is ready so the loop stays alive until the flush callback runs;
  // otherwise the awaited promise never settles and the test hangs.
  await once(transport, 'ready')
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

  // Restore the unref'd state so the test process can exit cleanly.
  transport.unref()
})
