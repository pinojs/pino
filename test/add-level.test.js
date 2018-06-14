'use strict'

var test = require('tap').test
var sink = require('./helper').sink
var pino = require('../')

test('can add a custom level via constructor', ({end, is}) => {
  var log = pino({level: 'foo', levelVal: 35}, sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    end()
  }))

  is(typeof log.foo, 'function')
  log.foo('bar')
})

test('can add a custom level to a prior instance', ({end, is}) => {
  var log = pino(sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    end()
  }))

  log.addLevel('foo2', 35)
  is(typeof log.foo2, 'function')
  log.foo2('bar')
})

test('custom level via constructor does not affect other instances', ({end, is}) => {
  var log = pino({level: 'foo3', levelVal: 36})
  var other = pino()
  is(typeof log.foo3, 'function')
  is(typeof other.foo3, 'undefined')
  end()
})

test('custom level on one instance does not affect other instances', ({end, is}) => {
  var log = pino()
  log.addLevel('foo4', 37)
  var other = pino()
  log.addLevel('foo5', 38)
  is(typeof other.foo4, 'undefined')
  is(typeof other.foo5, 'undefined')
  end()
})

test('custom levels encompass higher levels', ({end, is}) => {
  var log = pino({level: 'foo', levelVal: 35}, sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    end()
  }))

  log.warn('bar')
})

test('after the fact add level does not include lower levels', ({end, is}) => {
  var log = pino(sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    end()
  }))

  log.addLevel('foo', 35)
  log.level = 'foo'
  log.info('nope')
  log.foo('bar')
})

test('after the fact add of a lower level does not include it', ({end, is}) => {
  var log = pino(sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    end()
  }))

  log.level = 'info'
  log.addLevel('foo', 15)
  log.info('bar')
  log.foo('nope')
})

test('children can be set to custom level', ({end, is}) => {
  var parent = pino({level: 'foo', levelVal: 35}, sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    is(chunk.child, 'yes')
    end()
  }))
  var child = parent.child({child: 'yes'})
  child.foo('bar')
})

test('custom levels exists on children', ({end, is}) => {
  var parent = pino({}, sink(function (chunk, enc) {
    is(chunk.msg, 'bar')
    is(chunk.child, 'yes')
    end()
  }))
  parent.addLevel('foo', 35)
  var child = parent.child({child: 'yes'})
  child.foo('bar')
})

test('rejects already known labels', ({end, is}) => {
  var log = pino({level: 'info', levelVal: 900})
  is(log.levelVal, 30)
  end()
})

test('reject already known values', ({end, is}) => {
  try {
    pino({level: 'foo', levelVal: 30})
  } catch (e) {
    is(e.message.indexOf('level value') > -1, true)
  } finally {
    end()
  }
})

test('reject values of Infinity', ({end, throws}) => {
  throws(function () {
    pino({level: 'foo', levelVal: Infinity})
  }, /.*level value is already used.*/)
  end()
})

test('level numbers are logged correctly after level change', ({end, is}) => {
  var log = pino({level: 'foo', levelVal: 25}, sink(function (chunk, enc) {
    is(chunk.level, 25)
    end()
  }))
  log.level = 'debug'
  log.foo('bar')
})

test('levels state is not shared between instances', ({end, is}) => {
  var instance1 = pino({level: 'foo', levelVal: 35})
  is(typeof instance1.foo, 'function')

  var instance2 = pino()
  is(instance2.hasOwnProperty('foo'), false)
  end()
})
