'use strict'

var test = require('tap').test
var pino = require('../')

test('can check if current level enabled', ({end, is}) => {
  var log = pino({level: 'debug'})
  is(true, log.isLevelEnabled('debug'))
  end()
})

test('can check if level enabled after level set', ({end, is}) => {
  var log = pino()
  is(false, log.isLevelEnabled('debug'))
  log.level = 'debug'
  is(true, log.isLevelEnabled('debug'))
  end()
})

test('can check if higher level enabled', ({end, is}) => {
  var log = pino({level: 'debug'})
  is(true, log.isLevelEnabled('error'))
  end()
})

test('can check if lower level is disabled', ({end, is}) => {
  var log = pino({level: 'error'})
  is(false, log.isLevelEnabled('trace'))
  end()
})

test('can check if child has current level enabled', ({end, is}) => {
  var log = pino().child({level: 'debug'})
  is(true, log.isLevelEnabled('debug'))
  is(true, log.isLevelEnabled('error'))
  is(false, log.isLevelEnabled('trace'))
  end()
})

test('can check if custom level is enabled', ({end, is}) => {
  var log = pino({level: 'debug'})
  log.addLevel('foo', 35)
  is(true, log.isLevelEnabled('foo'))
  is(true, log.isLevelEnabled('error'))
  is(false, log.isLevelEnabled('trace'))
  end()
})
