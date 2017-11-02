'use strict'

var test = require('tap').test
var pino = require('../')
var pretty = require('../pretty')
var writer = require('flush-write-stream')

function capture () {
  var ws = writer(function (chunk, enc, cb) {
    this.data += chunk.toString()
    cb()
  })
  ws.data = ''
  return ws
}

test('pino uses LF by default', function (t) {
  t.plan(1)
  var stream = capture()
  var logger = pino(stream)
  logger.info('foo')
  logger.error('bar')
  t.ok(/foo[^\r\n]+\n[^\r\n]+bar[^\r\n]+\n/.test(stream.data))
  t.end()
})

test('pino can log CRLF', function (t) {
  t.plan(1)
  var stream = capture()
  var logger = pino({
    crlf: true
  }, stream)
  logger.info('foo')
  logger.error('bar')
  t.ok(/foo[^\n]+\r\n[^\n]+bar[^\n]+\r\n/.test(stream.data))
  t.end()
})

test('pretty can log CRLF', function (t) {
  t.plan(1)
  var prettier = pretty({
    crlf: true,
    formatter: function (data) {
      return data.msg
    }
  })

  var stream = capture()
  prettier.pipe(stream)

  var logger = pino(prettier)
  logger.info('foo')
  logger.info('bar')

  t.is(stream.data, 'foo\r\nbar\r\n')
  t.end()
})
