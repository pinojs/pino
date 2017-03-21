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

// more generic version of check(), with 'wanted' an object
function checkGen (t, chunk, wanted) {
  t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
  delete chunk.time
  t.deepEqual(chunk, Object.assign({
    pid: pid,
    hostname: hostname,
    v: 1
  }, wanted))
}

module.exports.sink = sink
module.exports.check = check
module.exports.checkGen = checkGen
