'use strict'

// Regression for the defense-in-depth in lib/tools.js — the
// `else if` that loads a transport now requires `transport` to be
// the caller's own property, not inherited from Object.prototype.
//
// Threat model anchor: pino doesn't promise PP-safety in general,
// but if Object.prototype.transport is polluted upstream, the
// gadget would otherwise reach `thread-stream` -> dynamic import()
// of an attacker-controlled module path. The own-property check
// closes that read site without altering behaviour for normal
// callers.

const test = require('node:test')
const assert = require('node:assert')
const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { setTimeout: sleep } = require('node:timers/promises')

const { file, watchFileCreated } = require('../helper')
const pino = require('../../')

const ATTACKER_FIXTURE = join(__dirname, '..', 'fixtures', 'transport-pp-gadget-sentinel.mjs')

function withPollutedTransport (target, fn) {
  // Defensive: never overwrite an existing inherited descriptor; if
  // another test in the same process has already set it (which it
  // shouldn't), fail loudly rather than silently masking the issue.
  assert.equal(Object.hasOwn(Object.prototype, 'transport'), false,
    'Object.prototype.transport already polluted before test start')
  Object.prototype.transport = { target } // eslint-disable-line no-extend-native
  try {
    return fn()
  } finally {
    delete Object.prototype.transport
  }
}

test('pino() ignores inherited Object.prototype.transport (gadget closed)', async () => {
  const sentinel = file()
  process.env.PINO_PP_TEST_SENTINEL = sentinel

  try {
    withPollutedTransport(ATTACKER_FIXTURE, () => {
      // No own `transport` here. With the defense, this MUST take the
      // default branch and return a plain stdout-backed logger.
      const instance = pino()
      // Sanity: instance should still be a usable logger.
      assert.equal(typeof instance.info, 'function')
    })

    // Worker spawn + ESM resolve typically completes within ~50ms;
    // give a generous window then assert the side effect never fired.
    await sleep(300)
    assert.equal(existsSync(sentinel), false,
      'attacker module was imported via the prototype-polluted transport gadget')
  } finally {
    delete process.env.PINO_PP_TEST_SENTINEL
  }
})

test('pino({transport: {target}}) still spawns the worker for own-property transport', async () => {
  // Same prototype-polluted state, but the caller supplies their own
  // `transport` -- the defense must not break this path.
  const destination = file()
  const legitFixture = join(__dirname, '..', 'fixtures', 'to-file-transport.mjs')

  await new Promise((resolve, reject) => {
    let instance
    try {
      withPollutedTransport(ATTACKER_FIXTURE, () => {
        instance = pino({
          transport: {
            target: legitFixture,
            options: { destination }
          }
        })
        instance.info('hello-from-own-property-transport')
      })
    } catch (err) {
      reject(err)
      return
    }
    // Flush the legit transport then check it received the line.
    watchFileCreated(destination).then(resolve, reject)
  })

  const written = readFileSync(destination, 'utf8')
  assert.match(written, /hello-from-own-property-transport/,
    'own-property transport did not receive the log line')
})
