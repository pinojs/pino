'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const bole = require('bole')('bench')
const winston = require('winston')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const loglevel = require('./utils/wrap-log-level')(dest)
const plog = pino(dest)
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))
delete require.cache[require.resolve('../')]
const plogUnsafe = require('../')({safe: false}, dest)
delete require.cache[require.resolve('../')]
const plogUnsafeExtreme = require('../')({safe: false}, pino.extreme('/dev/null'))
const blog = bunyan.createLogger({
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
const chill = winston.createLogger({
  transports: [
    new winston.transports.Stream({
      stream: fs.createWriteStream('/dev/null')
    })
  ]
})

const max = 10

const run = bench([
  function benchBunyanObj (cb) {
    for (var i = 0; i < max; i++) {
      blog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchWinstonObj (cb) {
    for (var i = 0; i < max; i++) {
      chill.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchBoleObj (cb) {
    for (var i = 0; i < max; i++) {
      bole.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchLogLevelObject (cb) {
    for (var i = 0; i < max; i++) {
      loglevel.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoObj (cb) {
    for (var i = 0; i < max; i++) {
      plog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeObj (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafe.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeObj (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeExtremeObj (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafeExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
