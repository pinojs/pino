'use strict'

const os = require('node:os')
const { test } = require('node:test')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()

test('metadata works', async t => {
  const now = Date.now()
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      t.assert.strictEqual(instance, this.lastLogger)
      t.assert.strictEqual(30, this.lastLevel)
      t.assert.strictEqual('a msg', this.lastMsg)
      t.assert.ok(Number(this.lastTime) >= now)
      t.assert.deepEqual(this.lastObj, { hello: 'world' })
      const result = JSON.parse(chunk)
      t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      t.assert.deepEqual(result, {
        pid,
        hostname,
        level: 30,
        hello: 'world',
        msg: 'a msg'
      })
    }
  })

  instance.info({ hello: 'world' }, 'a msg')
})

test('child loggers works', async t => {
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      t.assert.strictEqual(child, this.lastLogger)
      t.assert.strictEqual(30, this.lastLevel)
      t.assert.strictEqual('a msg', this.lastMsg)
      t.assert.deepEqual(this.lastObj, { from: 'child' })
      const result = JSON.parse(chunk)
      t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      t.assert.deepEqual(result, {
        pid,
        hostname,
        level: 30,
        hello: 'world',
        from: 'child',
        msg: 'a msg'
      })
    }
  })

  const child = instance.child({ hello: 'world' })
  child.info({ from: 'child' }, 'a msg')
})

test('without object', async t => {
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      t.assert.strictEqual(instance, this.lastLogger)
      t.assert.strictEqual(30, this.lastLevel)
      t.assert.strictEqual('a msg', this.lastMsg)
      t.assert.deepEqual({ }, this.lastObj)
      const result = JSON.parse(chunk)
      t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      t.assert.deepEqual(result, {
        pid,
        hostname,
        level: 30,
        msg: 'a msg'
      })
    }
  })

  instance.info('a msg')
})

test('without msg', async t => {
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      t.assert.strictEqual(instance, this.lastLogger)
      t.assert.strictEqual(30, this.lastLevel)
      t.assert.strictEqual(undefined, this.lastMsg)
      t.assert.deepEqual({ hello: 'world' }, this.lastObj)
      const result = JSON.parse(chunk)
      t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      t.assert.deepEqual(result, {
        pid,
        hostname,
        level: 30,
        hello: 'world'
      })
    }
  })

  instance.info({ hello: 'world' })
})
