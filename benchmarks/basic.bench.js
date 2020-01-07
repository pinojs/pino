/* eslint-disable no-unused-vars */
'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const bole = require('bole')('bench')
const winston = require('winston')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const loglevel = require('./utils/wrap-log-level')(dest)
const plogNodeStream = pino(dest)
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))
delete require.cache[require.resolve('../')]
const plogDest = require('../')(pino.destination('/dev/null'))

process.env.DEBUG = 'dlog'
const debug = require('debug')
const dlog = debug('dlog')
dlog.log = function (s) { dest.write(s) }

const max = 10
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

const run = bench([
  function benchBunyan (cb) {
    for (var i = 0; i < max; i++) {
      const msg = 'hello world'
      blog.info(msg)
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    for (var i = 0; i < max; i++) {
      const msg = 'hello world'
      chill.log('info', msg)
    }
    setImmediate(cb)
  },
  function benchBole (cb) {
    for (var i = 0; i < max; i++) {
      const msg = 'hello world'
      bole.info(msg)
    }
    setImmediate(cb)
  },
  function benchDebug (cb) {
    for (var i = 0; i < max; i++) {
      const msg = 'hello world'
      dlog(msg)
    }
    setImmediate(cb)
  },
  function benchLogLevel (cb) {
    for (var i = 0; i < max; i++) {
      const msg = 'hello world'
      loglevel.info(msg)
    }
    setImmediate(cb)
  },
  function benchPino (cb) {
    for (var i = 0; i < max; i++) {
      const msg = 'hello world'
      plogDest.info(msg)
    }
    setImmediate(cb)
  },
  function benchPinoExtreme (cb) {
    for (var i = 0; i < max; i++) {
      const msg = plogExtreme.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoNodeStream (cb) {
    for (var i = 0; i < max; i++) {
      const msg = plogNodeStream.info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run(run)
