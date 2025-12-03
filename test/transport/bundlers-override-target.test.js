'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { join } = require('node:path')
const { readFile } = require('node:fs').promises

// Set bundler overrides BEFORE loading pino
globalThis.__bundlerPathsOverrides = {
  foobar: join(__dirname, '..', 'fixtures', 'to-file-transport.js')
}

const { watchFileCreated, file } = require('../helper')
const pino = require('../../pino')

const { pid } = process
const hostname = os.hostname()

test('pino.transport with destination overridden by bundler', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: 'foobar',
    options: { destination }
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
    level: 30,
    msg: 'hello'
  })
})
