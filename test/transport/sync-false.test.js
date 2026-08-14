'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { join } = require('node:path')
const { readFile } = require('node:fs').promises
const { promisify } = require('node:util')

const execa = require('execa')

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

test('flush callback is invoked on an idle event loop with transport', async () => {
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-flush-idle.js')], {
    timeout: 15000,
    killSignal: 'SIGKILL'
  })

  const { stdout, stderr, exitCode } = await child
  assert.equal(exitCode, 0, stderr)
  assert.match(stdout, /callback-fired/)
  assert.doesNotMatch(stdout + stderr, /callback-missing/)
})
