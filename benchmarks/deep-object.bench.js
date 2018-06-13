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
var plogExtreme = require('../')(pino.extreme('/dev/null'))
delete require.cache[require.resolve('../')]
var plogUnsafe = require('../')({safe: false}, dest)
delete require.cache[require.resolve('../')]
var plogUnsafeExtreme = require('../')({safe: false}, pino.extreme('/dev/null'))

var loglevel = require('./log-level-mock')(dest)

var deep = Object.assign({}, require('../package.json'), { level: 'info' })
deep.deep = Object.assign({}, JSON.parse(JSON.stringify(deep)))
deep.deep.deep = Object.assign({}, JSON.parse(JSON.stringify(deep)))
deep.deep.deep.deep = Object.assign({}, JSON.parse(JSON.stringify(deep)))

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

var chill = winston.createLogger({
  transports: [
    new winston.transports.Stream({
      stream: fs.createWriteStream('/dev/null')
    })
  ]
})

var run = bench([
  function benchBunyanDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      blog.info(deep)
    }
    setImmediate(cb)
  },
  function benchWinstonDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      chill.log(deep)
    }
    setImmediate(cb)
  },
  function benchBoleDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      bole.info(deep)
    }
    setImmediate(cb)
  },
  function benchLogLevelDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      loglevel.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      plog.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafe.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoExtremeDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeExtremeDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafeExtreme.info(deep)
    }
    setImmediate(cb)
  }
], 10000)

run(run)
