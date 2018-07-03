'use strict'
const os = require('os')
const { test } = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()
const level = 50
const name = 'error'

test('err is serialized with additional properties set on the Error object', async ({ok, same}) => {
  const stream = sink()
  const err = Object.assign(new Error('myerror'), {foo: 'bar'})
  const instance = pino(stream)
  instance.level = name
  instance[name](err)
  const result = await once(stream, 'data')
  ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid: pid,
    hostname: hostname,
    level: level,
    type: 'Error',
    msg: err.message,
    stack: err.stack,
    foo: err.foo,
    v: 1
  })
})

test('type should be retained, even if type is a property', async ({ok, same}) => {
  const stream = sink()
  const err = Object.assign(new Error('myerror'), {type: 'bar'})
  const instance = pino(stream)
  instance.level = name
  instance[name](err)
  const result = await once(stream, 'data')
  ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid: pid,
    hostname: hostname,
    level: level,
    type: 'bar',
    msg: err.message,
    stack: err.stack,
    v: 1
  })
})

test('type, message and stack should be first level properties', async ({ok, same}) => {
  const stream = sink()
  const err = Object.assign(new Error('foo'), { foo: 'bar' })
  const instance = pino(stream)
  instance.level = name
  instance[name](err)

  const result = await once(stream, 'data')
  ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid: pid,
    hostname: hostname,
    level: level,
    type: 'Error',
    msg: err.message,
    stack: err.stack,
    foo: err.foo,
    v: 1
  })
})

test('err serializer', async ({ok, same}) => {
  const stream = sink()
  const err = Object.assign(new Error('myerror'), {foo: 'bar'})
  const instance = pino({
    serializers: {
      err: pino.stdSerializers.err
    }
  }, stream)

  instance.level = name
  instance[name]({ err })
  const result = await once(stream, 'data')
  ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  same(result, {
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
})

test('an error with statusCode property is not confused for a http response', async ({ok, same}) => {
  const stream = sink()
  const err = Object.assign(new Error('StatusCodeErr'), { statusCode: 500 })
  const instance = pino(stream)

  instance.level = name
  instance[name](err)
  const result = await once(stream, 'data')

  ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid: pid,
    hostname: hostname,
    level: level,
    type: 'Error',
    msg: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    v: 1
  })
})
