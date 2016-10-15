'use strict'

var bench = require('fastbench')
var bunyan = require('bunyan')
var mspino = require('../multi-stream')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')

var tenStreams = [
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
var mspinoTen = mspino({streams: tenStreams})

var fourStreams = [
  {stream: dest},
  {stream: dest},
  {level: 'debug', stream: dest},
  {level: 'trace', stream: dest}
]
var mspinoFour = mspino({streams: fourStreams})

var max = 10
var blogTen = bunyan.createLogger({
  name: 'myapp',
  streams: tenStreams
})
var blogFour = bunyan.createLogger({
  name: 'myapp',
  streams: fourStreams
})

var run = bench([
  function benchBunyanTen (cb) {
    for (var i = 0; i < max; i++) {
      blogTen.info('hello world')
      blogTen.debug('hello world')
      blogTen.trace('hello world')
      blogTen.warn('hello world')
      blogTen.fatal('hello world')
    }
    setImmediate(cb)
  },
  function benchMSPinoTen (cb) {
    for (var i = 0; i < max; i++) {
      mspinoTen.info('hello world')
      mspinoTen.debug('hello world')
      mspinoTen.trace('hello world')
      mspinoTen.warn('hello world')
      mspinoTen.fatal('hello world')
    }
    setImmediate(cb)
  },
  function benchBunyanFour (cb) {
    for (var i = 0; i < max; i++) {
      blogFour.info('hello world')
      blogFour.debug('hello world')
      blogFour.trace('hello world')
    }
    setImmediate(cb)
  },
  function benchMSPinoFour (cb) {
    for (var i = 0; i < max; i++) {
      mspinoFour.info('hello world')
      mspinoFour.debug('hello world')
      mspinoFour.trace('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run()
