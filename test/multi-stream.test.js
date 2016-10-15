'use strict'

var writeStream = require('flush-write-stream')
var test = require('tap').test
var mspino = require('../multi-stream')

test('sends to multiple streams', function (t) {
  var messages = []
  var stream = writeStream(function (data, enc, cb) {
    messages.push(JSON.parse(data).msg)
    if (messages.length === 3) {
      t.is(messages.indexOf('info stream') > -1, true)
      t.is(messages.indexOf('debug stream') > -1, true)
      t.is(messages.indexOf('fatal stream') > -1, true)
      t.done()
    }
    cb()
  })
  var streams = [
    {stream: stream},
    {level: 'debug', stream: stream},
    {level: 'fatal', stream: stream}
  ]
  var log = mspino({streams: streams})
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
})

test('supports children', function (t) {
  var stream = writeStream(function (data, enc, cb) {
    var input = JSON.parse(data)
    t.is(input.msg, 'child stream')
    t.is(input.child, 'one')
    t.done()
    cb()
  })
  var streams = [
    {stream: stream}
  ]
  var log = mspino({streams: streams}).child({child: 'one'})
  log.info('child stream')
})

test('supports grandchildren', function (t) {
  var messages = []
  var stream = writeStream(function (data, enc, cb) {
    messages.push(JSON.parse(data))
    if (messages.length === 2) {
      var msg1 = messages[0]
      t.is(msg1.msg, 'grandchild stream')
      t.is(msg1.child, 'one')
      t.is(msg1.grandchild, 'two')

      var msg2 = messages[1]
      t.is(msg2.msg, 'debug grandchild')
      t.is(msg2.child, 'one')
      t.is(msg2.grandchild, 'two')

      t.done()
    }
    cb()
  })
  var streams = [
    {stream: stream},
    {level: 'debug', stream: stream}
  ]
  var log = mspino({streams: streams}).child({child: 'one'}).child({grandchild: 'two'})
  log.info('grandchild stream')
  log.debug('debug grandchild')
})
