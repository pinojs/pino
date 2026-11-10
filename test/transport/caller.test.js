'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { join } = require('node:path')
const execa = require('execa')

test('when using a custom transport outside node_modules, the first file outside node_modules should be used', async function () {
  const evalApp = join(__dirname, '../', '/fixtures/eval/index.js')
  const { stdout } = await execa(process.argv[0], [evalApp])
  assert.match(stdout, /done!/)
})

test('when using a custom transport where some files in stacktrace are in the node_modules, the first file outside node_modules should be used', async function () {
  const evalApp = join(__dirname, '../', '/fixtures/eval/node_modules/2-files.js')
  const { stdout } = await execa(process.argv[0], [evalApp])
  assert.match(stdout, /done!/)
})

test('when using a custom transport where all files in stacktrace are in the node_modules, the first file inside node_modules should be used', async function () {
  const evalApp = join(__dirname, '../', '/fixtures/eval/node_modules/14-files.js')
  const { stdout } = await execa(process.argv[0], [evalApp])
  assert.match(stdout, /done!/)
})

test('transport target resolution falls back to prepareStackTrace when getCallSites returns no script name (AsyncFunction / module runner)', async function () {
  const evalApp = join(__dirname, '../', '/fixtures/eval/async-module-runner.js')
  const { stdout } = await execa(process.argv[0], [evalApp])
  assert.match(stdout, /done!/)
})

test('getCallers returns callers array starting at caller of transport', function () {
  const getCallers = require('../../lib/caller')
  function fakeTransportWrapper () {
    return getCallers()
  }
  const callers = fakeTransportWrapper()
  assert.ok(Array.isArray(callers))
  assert.equal(callers[0], __filename)
})

test('transport accepts explicit caller option', async function (t) {
  const pino = require('../../')
  const os = require('node:os')
  const destination = join(os.tmpdir(), `pino-caller-${Date.now()}.log`)

  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination },
    caller: __filename
  })
  t.after(transport.end.bind(transport))
  assert.ok(transport)
})
