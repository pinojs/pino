'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const bole = require('bole')('bench')('child')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(dest).child({ a: 'property' })
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null')).child({ a: 'property' })

const max = 10
const blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
}).child({ a: 'property' })

require('bole').output({
  level: 'info',
  stream: dest
}).setFastTime(true)

const run = bench([
  function benchBunyanChild (cb) {
    for (var i = 0; i < max; i++) {
      blog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchBoleChild (cb) {
    for (var i = 0; i < max; i++) {
      bole.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild (cb) {
    for (var i = 0; i < max; i++) {
      plog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeChild (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
