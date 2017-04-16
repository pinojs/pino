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

// 'wanted' either:
// - an object (then expect all its properties, 'msg' optional)
// - or level property value
function check (t, chunk, wanted, msg) {
  t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
  delete chunk.time
  let ref = {
    pid: pid,
    hostname: hostname,
    v: 1
  }
  if (typeof wanted === 'object') {
    Object.assign(ref, wanted)
  } else {
    ref.level = wanted
  }
  if (typeof msg !== 'undefined') ref.msg = msg
  t.deepEqual(chunk, ref)
}

module.exports.sink = sink
module.exports.check = check
