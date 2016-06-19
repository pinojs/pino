'use strict'

var bench = require('fastbench')
var pino = require('../')
var bunyan = require('bunyan')
var bole = require('bole')('bench')
var winston = require('winston')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var loglevel = require('./loglevelMock')(dest)
var plog = pino(dest)
delete require.cache[require.resolve('../')]
var plogExtreme = require('../')({extreme: true}, dest)

process.env.DEBUG = 'dlog'
var debug = require('debug')
var dlog = debug('dlog')
dlog.log = function (s) { dest.write(s) }

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
      blog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    for (var i = 0; i < max; i++) {
      winston.info('hello world')
    }
    setImmediate(cb)
  },
  function benchBole (cb) {
    for (var i = 0; i < max; i++) {
      bole.info('hello world')
    }
    setImmediate(cb)
  },
  function benchDebug (cb) {
    for (var i = 0; i < max; i++) {
      dlog('hello world')
    }
    setImmediate(cb)
  },
  function benchLogLevel (cb) {
    for (var i = 0; i < max; i++) {
      loglevel.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPino (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoExreme (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run(run)
