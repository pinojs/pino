'use strict'
var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

var os = require('os')
var pid = process.pid
var hostname = os.hostname()
var level = 50
var name = 'error'

test('err is serialized with additional properties set on the Error object', function (t) {
  t.plan(2)
  var err = Object.assign(new Error('myerror'), {foo: 'bar'})
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
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

test('type should be retained, even if type is a property', function (t) {
  t.plan(2)
  var err = Object.assign(new Error('myerror'), {type: 'bar'})
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
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

test('type, message and stack should be first level properties', function (t) {
  t.plan(2)
  var err = Object.assign(new Error('foo'), { foo: 'bar' })
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
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

test('err serializer', function (t) {
  t.plan(2)
  var err = Object.assign(new Error('myerror'), {foo: 'bar'})
  var instance = pino({
    serializers: {
      err: pino.stdSerializers.err
    }
  }, sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
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

test('an error with statusCode property is not confused for a http response', function (t) {
  t.plan(2)
  var err = Object.assign(new Error('StatusCodeErr'), { statusCode: 500 })
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
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

test('stack is omitted if it is not set on err', t => {
  t.plan(2)
  var err = new Error('myerror')
  delete err.stack
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.equal(chunk.hasOwnProperty('stack'), false)
    cb()
  }))

  instance.level = name
  instance[name](err)
})

test('stack is rendered as any other property if it\'s not a string', t => {
  t.plan(3)
  var err = new Error('myerror')
  err.stack = null
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.equal(chunk.hasOwnProperty('stack'), true)
    t.equal(chunk.stack, null)
    cb()
  }))

  instance.level = name
  instance[name](err)
})
