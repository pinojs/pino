'use strict'

var fs = require('fs')
var pino = require('../')
var dest = fs.createWriteStream('/dev/null')

var log = pino(dest)

setTimeout(() => {
  var i = 0
  var max = 10000

  // warmup
  for (i; i < max; i += 1) {
    log.info('hello world')
  }

  // iteration 1
  for (i; i < max; i += 1) {
    log.info('hello world')
  }

  // iteration 2
  for (i; i < max; i += 1) {
    log.info('hello world')
  }

  // iteration 3
  for (i; i < max; i += 1) {
    log.info('hello world')
  }
}, 500)
