'use strict'

var bench = require('fastbench')
var pino = require('../')
var bunyan = require('bunyan')
var bole = require('bole')('bench')('child')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var plog = pino(dest).child({ a: 'property' })
delete require.cache[require.resolve('../')]
var plogExtreme = require('../')({extreme: true}, dest).child({ a: 'property' })

var max = 10
var blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
}).child({ a: 'property' })

require('bole').output({
  level: 'info',
  stream: dest
}).setFastTime(true)

var run = bench([
  function benchBunyanChild (cb) {
    for (var i = 0; i < max; i++) {
      blog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchBoleChild (cb) {
    for (var i = 0; i < max; i++) {
      bole.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild (cb) {
    for (var i = 0; i < max; i++) {
      plog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeChild (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
