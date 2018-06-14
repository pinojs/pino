'use strict'

const os = require('os')
const writer = require('flush-write-stream')
const split = require('split2')
const pid = process.pid
const hostname = os.hostname()
const v = 1

function sink (func = () => {}) {
  const result = split(JSON.parse)
  result.pipe(writer.obj(func))
  return result
}

function check (is, chunk, level, msg) {
  is(new Date(chunk.time) <= new Date(), true, 'time is greater than Date.now()')
  delete chunk.time
  is(chunk.pid, pid)
  is(chunk.hostname, hostname)
  is(chunk.level, level)
  is(chunk.msg, msg)
  is(chunk.v, v)
}

module.exports.sink = sink
module.exports.check = check
