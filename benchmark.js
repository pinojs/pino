'use strict'

var bench = require('fastbench')
var sermon = require('./')
var bunyan = require('bunyan')
var fs = require('fs')
var dest = fs.createWriteStream('/dev/null')
var slog = sermon(dest)
var blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
})

var run = bench([
  function benchBunyan (cb) {
    for (var i = 0; i < 5; i++) {
      blog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchSermon (cb) {
    for (var i = 0; i < 5; i++) {
      slog.info('hello world')
    }
    setImmediate(cb)
  }
], 10000)

run(run)
