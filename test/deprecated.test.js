'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

test('opts.slowtime', function (t) {
  if (typeof process.emitWarning === 'function') {
    process.once('warning', (msg) => {
      t.is(/`slowtime` is deprecated/.test(msg), true)
      t.end()
    })
  } else {
    const write = process.stderr.write
    process.stderr.write = (msg) => {
      t.is(/`slowtime` is deprecated/.test(msg), true)
      process.nextTick(t.end)
      process.stderr.write = write
    }
  }

  var instance = pino({slowtime: true},
    sink(function (chunk, enc, cb) {
      t.ok(Date.parse(chunk.time) <= new Date(), 'time is greater than Date.now()')
    }))

  instance.info('hello world')
})

test('pino.stdSerializers.wrapRespnonseSerializer', function (t) {
  if (typeof process.emitWarning === 'function') {
    process.once('warning', (msg) => {
      t.is(/`pino.stdSerializers.wrapRespnonseSerializer` is deprecated/.test(msg), true)
      t.end()
    })
  } else {
    const write = process.stderr.write
    process.stderr.write = (msg) => {
      t.is(/`pino.stdSerializers.wrapRespnonseSerializer` is deprecated/.test(msg), true)
      process.nextTick(t.end)
      process.stderr.write = write
    }
  }
  t.is(pino.stdSerializers.wrapRespnonseSerializer, pino.stdSerializers.wrapResponseSerializer)
})
