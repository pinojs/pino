'use strict'

var test = require('tap').test
var pino = require('../')

test('can check if current level enabled', function (t) {
  t.plan(1)

  var log = pino({level: 'debug'})
  t.is(true, log.isLevelEnabled('debug'))
})

test('can check if level enabled after level set', function (t) {
  t.plan(2)

  var log = pino()
  t.is(false, log.isLevelEnabled('debug'))
  log.level = 'debug'
  t.is(true, log.isLevelEnabled('debug'))
})

test('can check if higher level enabled', function (t) {
  t.plan(1)

  var log = pino({level: 'debug'})
  t.is(true, log.isLevelEnabled('error'))
})

test('can check if lower level is disabled', function (t) {
  t.plan(1)

  var log = pino({level: 'error'})
  t.is(false, log.isLevelEnabled('trace'))
})

test('can check if child has current level enabled', function (t) {
  t.plan(3)

  var log = pino().child({level: 'debug'})
  t.is(true, log.isLevelEnabled('debug'))
  t.is(true, log.isLevelEnabled('error'))
  t.is(false, log.isLevelEnabled('trace'))
})

test('can check if custom level is enabled', function (t) {
  t.plan(3)

  var log = pino({level: 'debug'})
  log.addLevel('foo', 35)
  t.is(true, log.isLevelEnabled('foo'))
  t.is(true, log.isLevelEnabled('error'))
  t.is(false, log.isLevelEnabled('trace'))
})
