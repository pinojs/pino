'use strict'

var test = require('tap').test
var pino = require('../')

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
