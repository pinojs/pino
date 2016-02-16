'use strict'

var test = require('tap').test
var sermon = require('./')
var writeStream = require('flush-write-stream')
var os = require('os')
var split = require('split2')
var pid = process.pid
var hostname = os.hostname()

function sink (func) {
  var result = split(JSON.parse)
  result.pipe(writeStream.obj(func))
  return result
}

function check (t, chunk, level, msg) {
  t.ok(Date.parse(chunk.time) <= new Date(), 'time is greater than Date.now()')
  delete chunk.time
  t.deepEqual(chunk, {
    pid: pid,
    hostname: hostname,
    level: level,
    msg: msg,
    v: 0
  })
}

function levelTest (name, level) {
  test(name + ' logs as ' + level, function (t) {
    t.plan(2)
    var instance = sermon(sink(function (chunk, enc, cb) {
      check(t, chunk, level, 'hello world')
    }))

    instance.level = name
    instance[name]('hello world')
  })
}

levelTest('fatal', 60)
levelTest('error', 50)
levelTest('warn', 40)
levelTest('info', 30)
levelTest('debug', 20)
levelTest('trace', 10)

test('set the level', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = sermon(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})
