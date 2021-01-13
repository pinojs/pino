'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const bole = require('bole')('bench')
const winston = require('winston')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plogNodeStream = pino(dest)
delete require.cache[require.resolve('../')]
const plogDest = require('../')(pino.destination('/dev/null'))
delete require.cache[require.resolve('../')]
const plogAsync = require('../')(pino.destination({ dest: '/dev/null', sync: false, minLength: 4096 }))

const crypto = require('crypto')

const longStr = crypto.randomBytes(2000).toString()

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
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      blog.info(longStr)
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      chill.info(longStr)
    }
    setImmediate(cb)
  },
  function benchBole (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      bole.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPino (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPinoAsync (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPinoNodeStream (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogNodeStream.info(longStr)
    }
    setImmediate(cb)
  }
], 1000)

run(run)
