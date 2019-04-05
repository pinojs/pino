'use strict'

const os = require('os')
const { test } = require('tap')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()

test('metadata works', async ({ ok, same, is }) => {
  const now = Date.now()
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      is(instance, this.lastLogger)
      is(30, this.lastLevel)
      is('a msg', this.lastMsg)
      ok(Number(this.lastTime) >= now)
      same(this.lastObj, { hello: 'world', msg: 'a msg' })
      const result = JSON.parse(chunk)
      ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      same(result, {
        pid: pid,
        hostname: hostname,
        level: 30,
        hello: 'world',
        msg: 'a msg',
        v: 1
      })
    }
  })

  instance.info({ hello: 'world' }, 'a msg')
})

test('child loggers works', async ({ ok, same, is }) => {
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      is(child, this.lastLogger)
      is(30, this.lastLevel)
      is('a msg', this.lastMsg)
      same(this.lastObj, { from: 'child', msg: 'a msg' })
      const result = JSON.parse(chunk)
      ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      same(result, {
        pid: pid,
        hostname: hostname,
        level: 30,
        hello: 'world',
        from: 'child',
        msg: 'a msg',
        v: 1
      })
    }
  })

  const child = instance.child({ hello: 'world' })
  child.info({ from: 'child' }, 'a msg')
})

test('without object', async ({ ok, same, is }) => {
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      is(instance, this.lastLogger)
      is(30, this.lastLevel)
      is('a msg', this.lastMsg)
      same({ msg: 'a msg' }, this.lastObj)
      const result = JSON.parse(chunk)
      ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      same(result, {
        pid: pid,
        hostname: hostname,
        level: 30,
        msg: 'a msg',
        v: 1
      })
    }
  })

  instance.info('a msg')
})

test('without msg', async ({ ok, same, is }) => {
  const instance = pino({}, {
    [Symbol.for('pino.metadata')]: true,
    write (chunk) {
      is(instance, this.lastLogger)
      is(30, this.lastLevel)
      is(undefined, this.lastMsg)
      same({ hello: 'world' }, this.lastObj)
      const result = JSON.parse(chunk)
      ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
      delete result.time
      same(result, {
        pid: pid,
        hostname: hostname,
        level: 30,
        hello: 'world',
        v: 1
      })
    }
  })

  instance.info({ hello: 'world' })
})
