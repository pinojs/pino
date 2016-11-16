'use strict'

var bench = require('fastbench')
var pino = require('../')
var bunyan = require('bunyan')
var bole = require('bole')('bench')
var winston = require('winston')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var plog = pino(dest)
delete require.cache[require.resolve('../')]
var plogExtreme = require('../')({extreme: true}, dest)

var deep = require('../package.json')
deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep.deep = JSON.parse(JSON.stringify(deep))

var longStr = JSON.stringify(deep)

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

winston.add(winston.transports.File, { filename: '/dev/null' })
winston.remove(winston.transports.Console)

var run = bench([
  function benchBunyan (cb) {
    for (var i = 0; i < max; i++) {
      blog.info(longStr)
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    for (var i = 0; i < max; i++) {
      winston.info(longStr)
    }
    setImmediate(cb)
  },
  function benchBole (cb) {
    for (var i = 0; i < max; i++) {
      bole.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPino (cb) {
    for (var i = 0; i < max; i++) {
      plog.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPinoExreme (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info(longStr)
    }
    setImmediate(cb)
  }
], 10000)

run(run)
