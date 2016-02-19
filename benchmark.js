'use strict'

var bench = require('fastbench')
var sermon = require('./')
var bunyan = require('bunyan')
var bole = require('bole')('bench')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var slog = sermon(dest)
var slogUnsafe = sermon(dest, {
  safe: false
})
var max = 10
var blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
})

require('bole').output({
  level: 'info',
  stream: dest
})

var run = bench([
  function benchBunyan (cb) {
    for (var i = 0; i < max; i++) {
      blog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchBole (cb) {
    for (var i = 0; i < max; i++) {
      bole.info('hello world')
    }
    setImmediate(cb)
  },
  function benchSermon (cb) {
    for (var i = 0; i < max; i++) {
      slog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchBunyanObj (cb) {
    for (var i = 0; i < max; i++) {
      blog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchSermonObj (cb) {
    for (var i = 0; i < max; i++) {
      slog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchSermonObjUnsafe (cb) {
    for (var i = 0; i < max; i++) {
      slogUnsafe.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchBoleObj (cb) {
    for (var i = 0; i < max; i++) {
      bole.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
