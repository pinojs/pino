'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink
var check = require('./helper').check

test('set the level by string', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('set the level by number', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.levelVal = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('set the level by number via string method', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('exposes level string mappings', function (t) {
  t.plan(1)
  t.equal(pino.levels.values.error, 50)
})

test('exposes level number mappings', function (t) {
  t.plan(1)
  t.equal(pino.levels.labels[50], 'error')
})

test('returns level integer', function (t) {
  t.plan(1)
  var instance = pino({ level: 'error' })
  t.equal(instance.levelVal, 50)
})

test('child returns level integer', function (t) {
  t.plan(1)
  var parent = pino({ level: 'error' })
  var child = parent.child({ foo: 'bar' })
  t.equal(child.levelVal, 50)
})

test('set the level via constructor', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino({ level: 'error' }, sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('enable', function (t) {
  var instance = pino({
    level: 'trace',
    enabled: false
  }, sink(function (chunk, enc, cb) {
    t.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('silent level', function (t) {
  var instance = pino({
    level: 'silent'
  }, sink(function (chunk, enc, cb) {
    t.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('setting level to 100', function (t) {
  var instance = pino({
    level: 100
  }, sink(function (chunk, enc, cb) {
    t.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('exposed levels', function (t) {
  t.plan(1)
  t.deepEqual(Object.keys(pino.levels.values), [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace'
  ])
})

test('exposed labels', function (t) {
  t.plan(1)
  t.deepEqual(Object.keys(pino.levels.labels), [
    '10',
    '20',
    '30',
    '40',
    '50',
    '60'
  ])
})

test('setting level in child', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  })).child({ level: 30 })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('level-change event', function (t) {
  var instance = pino()
  var handle = function (lvl, val, prevLvl, prevVal) {
    t.is(lvl, 'trace')
    t.is(val, 10)
    t.is(prevLvl, 'info')
    t.is(prevVal, 30)
  }
  instance.on('level-change', handle)
  instance.level = 'trace'
  instance.removeListener('level-change', handle)
  instance.level = 'info'

  var count = 0

  var l1 = function () { count += 1 }
  var l2 = function () { count += 1 }
  var l3 = function () { count += 1 }
  instance.on('level-change', l1)
  instance.on('level-change', l2)
  instance.on('level-change', l3)

  instance.level = 'trace'
  instance.removeListener('level-change', l3)
  instance.level = 'fatal'
  instance.removeListener('level-change', l1)
  instance.level = 'debug'
  instance.removeListener('level-change', l2)
  instance.level = 'info'

  t.is(count, 6)
  t.end()
})
