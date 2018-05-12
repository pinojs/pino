'use strict'

var bench = require('fastbench')
var pino = require('../')

var epoch = pino({timestamp: pino.stdTimeFunctions.epochTime}, pino.destination('/dev/null'))
var unix = pino({timestamp: pino.stdTimeFunctions.unixTime}, pino.destination('/dev/null'))
var utc = pino({timestamp: pino.stdTimeFunctions.utcTime}, pino.destination('/dev/null'))

var max = 100

var run = bench([
  function benchPinoEpochTime (cb) {
    for (var i = 0; i < max; i++) {
      epoch.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoUnixTime (cb) {
    for (var i = 0; i < max; i++) {
      unix.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoUtcTime (cb) {
    for (var i = 0; i < max; i++) {
      utc.info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run(run)
