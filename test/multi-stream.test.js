'use strict'

var fs = require('fs')
var test = require('tap').test
var mspino = require('../multi-stream')

test('sends to multiple streams', function (t) {
  var streams = [
    {stream: fs.createWriteStream('/tmp/info.out')},
    {level: 'debug', stream: fs.createWriteStream('/tmp/debug.out')},
    {level: 'fatal', stream: fs.createWriteStream('/tmp/fatal.out')}
  ]
  var log = mspino({streams: streams})
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')

  setImmediate(function () {
    var res = JSON.parse(fs.readFileSync('/tmp/info.out'))
    t.is(res.msg, 'info stream')

    res = JSON.parse(fs.readFileSync('/tmp/debug.out'))
    t.is(res.msg, 'debug stream')

    res = JSON.parse(fs.readFileSync('/tmp/fatal.out'))
    t.is(res.msg, 'fatal stream')

    t.done()
  })
})

test('supports children', function (t) {
  var streams = [
    {stream: fs.createWriteStream('/tmp/multichild.out')}
  ]
  var log = mspino({streams: streams}).child({child: 'one'})
  log.info('child stream')

  setImmediate(function () {
    var res = JSON.parse(fs.readFileSync('/tmp/multichild.out'))
    t.is(res.msg, 'child stream')
    t.is(res.child, 'one')

    t.done()
  })
})

test('supports grandchildren', function (t) {
  var streams = [
    {stream: fs.createWriteStream('/tmp/multigrandchild.out')}
  ]
  var log = mspino({streams: streams}).child({child: 'one'}).child({grandchild: 'two'})
  log.info('grandchild stream')

  setImmediate(function () {
    var res = JSON.parse(fs.readFileSync('/tmp/multigrandchild.out'))
    t.is(res.msg, 'grandchild stream')
    t.is(res.child, 'one')
    t.is(res.grandchild, 'two')

    t.done()
  })
})
