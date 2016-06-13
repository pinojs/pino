'use strict'

var writeStream = require('flush-write-stream')
var split = require('split2')
var os = require('os')
var pid = process.pid
var hostname = os.hostname()

function sink (func) {
  var result = split(JSON.parse)
  result.pipe(writeStream.obj(func))
  return result
}

function check (t, chunk, level, msg) {
  t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
  delete chunk.time
  t.deepEqual(chunk, {
    pid: pid,
    hostname: hostname,
    level: level,
    msg: msg,
    v: 1
  })
}

module.exports.sink = sink
module.exports.check = check
