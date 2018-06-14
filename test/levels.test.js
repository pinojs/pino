'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink
var check = require('./helper').check

test('set the level by string', ({end, is}) => {
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  end()
})

test('the wrong level throws', ({end, throws}) => {
  var instance = pino()
  throws(function () {
    instance.level = 'kaboom'
  })
  end()
})

test('set the level by number', ({end, is}) => {
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.levelVal = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  end()
})

test('set the level by number via string method', ({end, is}) => {
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  end()
})

test('exposes level string mappings', ({end, is}) => {
  is(pino.levels.values.error, 50)
  end()
})

test('exposes level number mappings', ({end, is}) => {
  is(pino.levels.labels[50], 'error')
  end()
})

test('returns level integer', ({end, is}) => {
  var instance = pino({ level: 'error' })
  is(instance.levelVal, 50)
  end()
})

test('child returns level integer', ({end, is}) => {
  var parent = pino({ level: 'error' })
  var child = parent.child({ foo: 'bar' })
  is(child.levelVal, 50)
  end()
})

test('set the level via constructor', ({end, is}) => {
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino({ level: 'error' }, sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  end()
})

test('level-change event', ({end, is}) => {
  var instance = pino()
  var handle = function (lvl, val, prevLvl, prevVal) {
    is(lvl, 'trace')
    is(val, 10)
    is(prevLvl, 'info')
    is(prevVal, 30)
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

  is(count, 6)

  end()
})

test('enable', ({end, fail}) => {
  var instance = pino({
    level: 'trace',
    enabled: false
  }, sink(function (chunk, enc) {
    fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })

  end()
})

test('silent level', ({end, fail}) => {
  var instance = pino({
    level: 'silent'
  }, sink(function (chunk, enc) {
    fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })

  end()
})

test('silent is a noop', ({end, fail}) => {
  var instance = pino({
    level: 'silent'
  }, sink(function (chunk, enc) {
    fail('no data should be logged')
  }))

  instance['silent']('hello world')

  end()
})

test('silent stays a noop after level changes', ({end, is, isNot, fail}) => {
  var noop = require('../lib/tools').noop
  var instance = pino({
    level: 'silent'
  }, sink(function (chunk, enc) {
    fail('no data should be logged')
  }))

  instance.level = 'trace'
  isNot(instance[instance.level], noop)

  instance.level = 'silent'
  instance['silent']('hello world')
  is(instance[instance.level], noop)

  end()
})

test('exposed levels', ({end, same}) => {
  same(Object.keys(pino.levels.values), [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace'
  ])
  end()
})

test('exposed labels', ({end, same}) => {
  same(Object.keys(pino.levels.labels), [
    '10',
    '20',
    '30',
    '40',
    '50',
    '60'
  ])
  end()
})

test('setting level in child', ({end, is}) => {
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  })).child({ level: 30 })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  end()
})
