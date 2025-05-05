'use strict'

const { test } = require('node:test')
const { join } = require('node:path')
const { fork } = require('node:child_process')
const { once } = require('./helper')
const writer = require('flush-write-stream')
const pino = require('..')

test('do not use SonicBoom is someone tampered with process.stdout.write', async (t) => {
  let actual = ''
  const child = fork(join(__dirname, 'fixtures', 'stdout-hack-protection.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  t.assert.notStrictEqual(actual.match(/^hack/), null)
})

test('do not use SonicBoom is someone has passed process.stdout to pino', async (t) => {
  const logger = pino(process.stdout)
  t.assert.strictEqual(logger[pino.symbols.streamSym], process.stdout)
})

test('do not crash if process.stdout has no fd', async (t) => {
  const fd = process.stdout.fd
  delete process.stdout.fd
  t.after(function () { process.stdout.fd = fd })
  pino()
})

test('use fd=1 if process.stdout has no fd in pino.destination() (worker case)', async (t) => {
  const fd = process.stdout.fd
  delete process.stdout.fd
  t.after(function () { process.stdout.fd = fd })
  pino.destination()
})
