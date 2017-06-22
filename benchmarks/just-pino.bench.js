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
