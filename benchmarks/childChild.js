'use strict'

var bench = require('fastbench')
var pino = require('../')
var bunyan = require('bunyan')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var plog = pino(dest).child({ a: 'property' }).child({sub: 'child'})
delete require.cache[require.resolve('../')]
var plogExtreme = require('../')({extreme: true}, dest).child({ a: 'property' }).child({sub: 'child'})

var max = 10
var blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
}).child({ a: 'property' }).child({sub: 'child'})

var run = bench([
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
  }
], 10000)

run(run)
