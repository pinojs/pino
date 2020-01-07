/* eslint-disable no-unused-vars */
'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plogNodeStream = pino(dest).child({ a: 'property' }).child({ sub: 'child' })
delete require.cache[require.resolve('../')]
const plogDest = require('../')(pino.destination('/dev/null'))
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))
  .child({ a: 'property' })
  .child({ sub: 'child' })

const max = 10
const blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
}).child({ a: 'property' }).child({ sub: 'child' })

const run = bench([
  function benchBunyanChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = { hello: 'world' }
      blog.info(obj)
    }
    setImmediate(cb)
  },
  function benchPinoChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = plogDest.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = plogExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoNodeStreamChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = plogNodeStream.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
