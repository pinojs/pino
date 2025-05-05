'use strict'

const os = require('node:os')
const { test } = require('node:test')
const { sink, once } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()
const level = 50
const name = 'error'

test('mixin object is included', async (t) => {
  let n = 0
  const stream = sink()
  const instance = pino({
    mixin () {
      return { hello: ++n }
    }
  }, stream)
  instance.level = name
  instance[name]('test')
  const result = await once(stream, 'data')
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  t.assert.deepStrictEqual(result, {
    pid,
    hostname,
    level,
    msg: 'test',
    hello: 1
  })
})

test('mixin object is new every time', async (t) => {
  t.plan(6)

  let n = 0
  const stream = sink()
  const instance = pino({
    mixin () {
      return { hello: n }
    }
  }, stream)
  instance.level = name

  while (++n < 4) {
    const msg = `test #${n}`
    stream.pause()
    instance[name](msg)
    stream.resume()
    const result = await once(stream, 'data')
    t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
    delete result.time
    t.assert.deepStrictEqual(result, {
      pid,
      hostname,
      level,
      msg,
      hello: n
    })
  }
})

test('mixin object is not called if below log level', async (t) => {
  const stream = sink()
  const instance = pino({
    mixin () {
      t.assert.ok(false, 'should not call mixin function')
    }
  }, stream)
  instance.level = 'error'
  instance.info('test')
})

test('mixin object + logged object', async (t) => {
  const stream = sink()
  const instance = pino({
    mixin () {
      return { foo: 1, bar: 2 }
    }
  }, stream)
  instance.level = name
  instance[name]({ bar: 3, baz: 4 })
  const result = await once(stream, 'data')
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  t.assert.deepStrictEqual(result, {
    pid,
    hostname,
    level,
    foo: 1,
    bar: 3,
    baz: 4
  })
})

test('mixin not a function', async (t) => {
  const stream = sink()
  t.assert.throws(function () {
    pino({ mixin: 'not a function' }, stream)
  })
})

test('mixin can use context', async (t) => {
  const stream = sink()
  const instance = pino({
    mixin (context) {
      t.assert.ok(context !== null, 'context should be defined')
      t.assert.ok(context !== undefined, 'context should be defined')
      t.assert.deepStrictEqual(context, {
        message: '123',
        stack: 'stack'
      })
      return Object.assign({
        error: context.message,
        stack: context.stack
      })
    }
  }, stream)
  instance.level = name
  instance[name]({
    message: '123',
    stack: 'stack'
  }, 'test')
})

test('mixin works without context', async (t) => {
  const stream = sink()
  const instance = pino({
    mixin (context) {
      t.assert.ok(context !== null, 'context is still defined w/o passing mergeObject')
      t.assert.ok(context !== undefined, 'context is still defined w/o passing mergeObject')
      t.assert.deepStrictEqual(context, {})
      return {
        something: true
      }
    }
  }, stream)
  instance.level = name
  instance[name]('test')
})

test('mixin can use level number', async (t) => {
  const stream = sink()
  const instance = pino({
    mixin (context, num) {
      t.assert.ok(num !== null, 'level should be defined')
      t.assert.ok(num !== undefined, 'level should be defined')
      t.assert.deepStrictEqual(num, level)
      return Object.assign({
        error: context.message,
        stack: context.stack
      })
    }
  }, stream)
  instance.level = name
  instance[name]({
    message: '123',
    stack: 'stack'
  }, 'test')
})

test('mixin receives logger as third parameter', async (t) => {
  const stream = sink()
  const instance = pino({
    mixin (context, num, logger) {
      t.assert.ok(logger !== null, 'logger should be defined')
      t.assert.ok(logger !== undefined, 'logger should be defined')
      t.assert.deepStrictEqual(logger, instance)
      return { ...context, num }
    }
  }, stream)
  instance.level = name
  instance[name]({
    message: '123'
  }, 'test')
})

test('mixin receives child logger', async (t) => {
  const stream = sink()
  let child = null
  const instance = pino({
    mixin (context, num, logger) {
      t.assert.ok(logger !== null, 'logger should be defined')
      t.assert.ok(logger !== undefined, 'logger should be defined')
      t.assert.deepStrictEqual(logger.expected, child.expected)
      return { ...context, num }
    }
  }, stream)
  instance.level = name
  instance.expected = false
  child = instance.child({})
  child.expected = true
  child[name]({
    message: '123'
  }, 'test')
})

test('mixin receives logger even if child exists', async (t) => {
  const stream = sink()
  let child = null
  const instance = pino({
    mixin (context, num, logger) {
      t.assert.ok(logger !== null, 'logger should be defined')
      t.assert.ok(logger !== undefined, 'logger should be defined')
      t.assert.deepStrictEqual(logger.expected, instance.expected)
      return { ...context, num }
    }
  }, stream)
  instance.level = name
  instance.expected = false
  child = instance.child({})
  child.expected = true
  instance[name]({
    message: '123'
  }, 'test')
})
