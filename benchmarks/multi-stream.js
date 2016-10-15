'use strict'

var bench = require('fastbench')
var bunyan = require('bunyan')
var mspino = require('../multi-stream')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var streams = [
  {stream: dest},
  {stream: dest},
  {stream: dest},
  {stream: dest},
  {stream: dest},
  {level: 'debug', stream: dest},
  {level: 'debug', stream: dest},
  {level: 'trace', stream: dest},
  {level: 'warn', stream: dest},
  {level: 'fatal', stream: dest}
]
var log = mspino({streams: streams})

var max = 10
var blog = bunyan.createLogger({
  name: 'myapp',
  streams: streams
})

var run = bench([
  function benchBunyan (cb) {
    for (var i = 0; i < max; i++) {
      blog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchMSPino (cb) {
    for (var i = 0; i < max; i++) {
      log.info('hello world')
      log.debug('hello world')
      log.trace('hello world')
      log.warn('hello world')
      log.fatal('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run()
