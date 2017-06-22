'use strict'

var bench = require('fastbench')
var pino = require('../')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var plog = pino(dest)
delete require.cache[require.resolve('../')]
var plogExtreme = require('../')({extreme: true}, dest)
var max = 10

var run = bench([
//  function benchBunyan (cb) {
//    for (var i = 0; i < max; i++) {
//      blog.info('hello world')
//    }
//    setImmediate(cb)
//  },
//  function benchWinston (cb) {
//    for (var i = 0; i < max; i++) {
//      winston.info('hello world')
//    }
//    setImmediate(cb)
//  },
//  function benchBole (cb) {
//    for (var i = 0; i < max; i++) {
//      bole.info('hello world')
//    }
//    setImmediate(cb)
//  },
//  function benchDebug (cb) {
//    for (var i = 0; i < max; i++) {
//      dlog('hello world')
//    }
//    setImmediate(cb)
//  },
//  function benchLogLevel (cb) {
//    for (var i = 0; i < max; i++) {
//      loglevel.info('hello world')
//    }
//    setImmediate(cb)
//  },
  function benchPino (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoExtreme (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run(run)
