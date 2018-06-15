'use strict'
const os = require('os')
const { test } = require('tap')
const { sink } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()
const level = 50
const name = 'error'

test('err is serialized with additional properties set on the Error object', async ({ok, same}) => {
  const err = Object.assign(new Error('myerror'), {foo: 'bar'})
  const instance = pino(sink((chunk, enc, cb) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: level,
      type: 'Error',
      msg: err.message,
      stack: err.stack,
      foo: err.foo,
      v: 1
    })
    cb()
  }))

  instance.level = name
  instance[name](err)
})

test('type should be retained, even if type is a property', async ({ok, same}) => {
  const err = Object.assign(new Error('myerror'), {type: 'bar'})
  const instance = pino(sink((chunk, enc, cb) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: level,
      type: 'bar',
      msg: err.message,
      stack: err.stack,
      v: 1
    })
    cb()
  }))

  instance.level = name
  instance[name](err)
})

test('type, message and stack should be first level properties', async ({ok, same}) => {
  const err = Object.assign(new Error('foo'), { foo: 'bar' })
  const instance = pino(sink((chunk, enc, cb) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: level,
      type: 'Error',
      msg: err.message,
      stack: err.stack,
      foo: err.foo,
      v: 1
    })
    cb()
  }))

  instance.level = name
  instance[name](err)
})

test('err serializer', async ({ok, same}) => {
  const err = Object.assign(new Error('myerror'), {foo: 'bar'})
  const instance = pino({
    serializers: {
      err: pino.stdSerializers.err
    }
  }, sink((chunk, enc, cb) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: level,
      err: {
        type: 'Error',
        message: err.message,
        stack: err.stack,
        foo: err.foo
      },
      v: 1
    })
    cb()
  }))

  instance.level = name
  instance[name]({ err })
})

test('an error with statusCode property is not confused for a http response', async ({ok, same}) => {
  const err = Object.assign(new Error('StatusCodeErr'), { statusCode: 500 })
  const instance = pino(sink((chunk, enc, cb) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: level,
      type: 'Error',
      msg: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      v: 1
    })
    cb()
  }))

  instance.level = name
  instance[name](err)
})
