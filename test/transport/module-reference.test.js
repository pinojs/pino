'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { readFile } = require('node:fs').promises

const { watchFileCreated, file } = require('../helper')
const pino = require('../../')

const { pid } = process
const hostname = os.hostname()

// Load the fixture transport that exports getModule()
const toFileTransportWithGetModule = require('../fixtures/to-file-transport-with-getmodule.js')

test('pino.transport accepts a module reference (getModule) as target', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: toFileTransportWithGetModule,
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello from module reference')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello from module reference'
  })
})

test('pino.transport accepts module reference in targets array', async (t) => {
  const destination = file()
  const transport = pino.transport({
    targets: [
      {
        target: toFileTransportWithGetModule,
        options: { destination }
      }
    ]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello from module reference in targets')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello from module reference in targets'
  })
})

test('pino.transport throws when getModule() returns a non-string', (t) => {
  const badRef = {
    getModule () { return 42 }
  }
  assert.throws(
    () => pino.transport({ target: badRef }),
    /getModule\(\) must return a string path/
  )
})

test('pino.transport module reference: getModule() path is used correctly', (t) => {
  // Verify that getModule returns __filename (an absolute path)
  const path = toFileTransportWithGetModule.getModule()
  assert.strictEqual(typeof path, 'string')
  assert.ok(require('node:path').isAbsolute(path), 'getModule() should return an absolute path')
})
