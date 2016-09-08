'use strict'

var bench = require('fastbench')
var pino = require('../')
var bunyan = require('bunyan')
var bole = require('bole')('bench')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var plog = pino(dest)
delete require.cache[require.resolve('../')]

var tty = require('tty')
var extremeDest = new tty.WriteStream(1)
extremeDest.write = function (s) { dest.write(s) }
var plogExtreme = require('../')({extreme: true}, extremeDest)

var max = 10
var blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
})

require('bole').output({
  level: 'info',
  stream: dest
}).setFastTime(true)

var run = bench([
  function benchBunyanCreation (cb) {
    var child = blog.child({ a: 'property' })
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchBoleCreation (cb) {
    var child = bole('child')
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoCreation (cb) {
    var child = plog.child({ a: 'property' })
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeCreation (cb) {
    var child = plogExtreme.child({ a: 'property' })
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
