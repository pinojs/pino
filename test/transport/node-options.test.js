'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { EventEmitter } = require('node:events')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const proxyquire = require('proxyquire')

function buildTransportWithFakeThreadStream () {
  let lastCtorOpts

  class FakeThreadStream extends EventEmitter {
    constructor (opts) {
      super()
      this._closed = false
      lastCtorOpts = opts
    }

    unref () {}
    ref () {}
    flushSync () {}
    end () {
      this._closed = true
      this.emit('close')
    }

    get closed () {
      return this._closed
    }
  }

  const transport = proxyquire('../../lib/transport', {
    'thread-stream': FakeThreadStream
  })

  return {
    transport,
    getLastCtorOpts () {
      return lastCtorOpts
    }
  }
}

test('pino.transport sanitizes missing absolute preload in NODE_OPTIONS', () => {
  const previous = process.env.NODE_OPTIONS
  const missing = join(__dirname, '..', 'fixtures', 'missing-preload.js')
  process.env.NODE_OPTIONS = `--require ${missing} --trace-warnings`

  const { transport, getLastCtorOpts } = buildTransportWithFakeThreadStream()
  transport({ target: join(__dirname, '..', 'fixtures', 'to-file-transport.js') })

  assert.equal(getLastCtorOpts().workerOpts.env.NODE_OPTIONS, '--trace-warnings')

  if (previous === undefined) {
    delete process.env.NODE_OPTIONS
  } else {
    process.env.NODE_OPTIONS = previous
  }
})

test('pino.transport sanitizes missing file:// preload in NODE_OPTIONS', () => {
  const previous = process.env.NODE_OPTIONS
  const missingFileUrl = pathToFileURL(join(__dirname, '..', 'fixtures', 'missing-import.mjs')).href
  process.env.NODE_OPTIONS = `--import=${missingFileUrl}`

  const { transport, getLastCtorOpts } = buildTransportWithFakeThreadStream()
  transport({ target: join(__dirname, '..', 'fixtures', 'to-file-transport.js') })

  assert.equal(getLastCtorOpts().workerOpts.env.NODE_OPTIONS, '')

  if (previous === undefined) {
    delete process.env.NODE_OPTIONS
  } else {
    process.env.NODE_OPTIONS = previous
  }
})

test('pino.transport keeps relative preload flags in NODE_OPTIONS', () => {
  const previous = process.env.NODE_OPTIONS
  process.env.NODE_OPTIONS = '--require ./relative-preload.js'

  const { transport, getLastCtorOpts } = buildTransportWithFakeThreadStream()
  transport({ target: join(__dirname, '..', 'fixtures', 'to-file-transport.js') })

  assert.equal(getLastCtorOpts().workerOpts.env, undefined)

  if (previous === undefined) {
    delete process.env.NODE_OPTIONS
  } else {
    process.env.NODE_OPTIONS = previous
  }
})

test('pino.transport does not override explicit worker.env', () => {
  const previous = process.env.NODE_OPTIONS
  process.env.NODE_OPTIONS = `--require ${join(__dirname, '..', 'fixtures', 'missing-preload.js')}`

  const explicitEnv = { NODE_OPTIONS: '--trace-warnings' }

  const { transport, getLastCtorOpts } = buildTransportWithFakeThreadStream()
  transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    worker: {
      env: explicitEnv
    }
  })

  assert.equal(getLastCtorOpts().workerOpts.env, explicitEnv)

  if (previous === undefined) {
    delete process.env.NODE_OPTIONS
  } else {
    process.env.NODE_OPTIONS = previous
  }
})
