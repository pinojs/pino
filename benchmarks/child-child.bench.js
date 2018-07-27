'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(pino.destination('/dev/null')).child({ a: 'property' }).child({sub: 'child'})
delete require.cache[require.resolve('../')]
const plogNodeStream = pino(dest).child({ a: 'property' }).child({sub: 'child'})
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))
  .child({ a: 'property' })
  .child({sub: 'child'})

const max = 10
const blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
}).child({ a: 'property' }).child({sub: 'child'})

const run = bench([
  function benchBunyanChildChild (cb) {
    for (var i = 0; i < max; i++) {
      blog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChild (cb) {
    for (var i = 0; i < max; i++) {
      plog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeChildChild (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoNodeStreamChildChild (cb) {
    for (var i = 0; i < max; i++) {
      plogNodeStream.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
