'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const bole = require('bole')('bench')
const winston = require('winston')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(dest)
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))

const deep = require('../package.json')
deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep.deep = JSON.parse(JSON.stringify(deep))

const longStr = JSON.stringify(deep)

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

var chill = winston.createLogger({
  transports: [
    new winston.transports.Stream({
      stream: fs.createWriteStream('/dev/null')
    })
  ]
})

var run = bench([
  function benchBunyan (cb) {
    for (var i = 0; i < max; i++) {
      blog.info(longStr)
    }
    setImmediate(cb)
  },
  function benchWinston (cb) {
    for (var i = 0; i < max; i++) {
      chill.info(longStr)
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
  function benchPinoExtreme (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info(longStr)
    }
    setImmediate(cb)
  }
], 10000)

run(run)
