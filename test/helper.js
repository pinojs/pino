'use strict'

const os = require('os')
const writer = require('flush-write-stream')
const split = require('split2')
const pid = process.pid
const hostname = os.hostname()
const v = 1

function once (emitter, name) {
  return new Promise((resolve) => emitter.once(name, resolve))
}

function sink (func) {
  const result = split(JSON.parse)
  var extract
  const next = () => new Promise((resolve) => { extract = resolve })
  result.pipe(writer.obj(func || ((value, enc, cb) => {
    result.next = next()
    extract(value)
    result.next.then(() => cb())
  })))
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

module.exports = { sink, check, once }
