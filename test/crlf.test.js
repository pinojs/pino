'use strict'

var test = require('tap').test
var pino = require('../')
var Writable = require('stream').Writable

class LogWriteStream extends Writable {
  constructor () {
    super()
    this.data = ''
  }

  write (data) {
    this.data += data
  }

  toString () {
    return this.data
  }
}

test('pino uses LF by default', function (t) {
  t.plan(1)
  var stream = new LogWriteStream()
  var logger = pino(stream)
  logger.info('foo')
  logger.error('bar')
  t.ok(/foo[^\r\n]+\n[^\r\n]+bar[^\r\n]+\n/.test(stream.toString()));
  t.end()
})

test('pino can log CRLF', function (t) {
  t.plan(1)
  var stream = new LogWriteStream()
  var logger = pino({
    crlf: true
  }, stream)
  logger.info('foo')
  logger.error('bar')
  t.ok(/foo[^\n]+\r\n[^\n]+bar[^\n]+\r\n/.test(stream.toString()));
  t.end()
})
