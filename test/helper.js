'use strict'

const os = require('os')
const writer = require('flush-write-stream')
const split = require('split2')
const pid = process.pid
const hostname = os.hostname()
const v = 1

function expected (str) {
  var memo = new WeakMap()

  var valid = {
    string: n => n !== void 0 && n.length > 0 && typeof n === 'string',
    array: n => Array.isArray(n) && n.length > 0,
    object: n => n !== null && typeof n === 'object'
  }
  var cursor = {
    set: (k, v) => (valid.object(k)) ? memo.set(k, v) : void 0,
    get: (k) => (valid.object(k)) ? memo.get(k) : void 0,
    has: (k) => (valid.object(k)) ? memo.has(k) : void 0
  }

  var shake = ({ s_, ndl_ }) => {
    var delim = ' '
    /* eslint-disable */
    var sane = /([\s()[\[^\]]:*)/mg
    /* eslint-enable */

    if (!valid.string(s_) || !valid.array(ndl_)) return void 0

    var tree = s_.replace(sane, ' ').split(delim).filter(o => ndl_.indexOf(o) !== -1)
    return tree.length !== 0
  }

  return {
    output: function output$ ({ has }) {
      if (!valid.string(str)) return void 0
      var prev = { str: str, has: has }
      var tree = shake({ s_: str, ndl_: has })
      if (!cursor.has(prev)) cursor.set(prev, tree)
      return cursor.get(prev)
    }
  }
}

function once (emitter, name) {
  return new Promise((resolve, reject) => {
    if (name !== 'error') emitter.once('error', reject)
    emitter.once(name, (...args) => {
      emitter.removeListener('error', reject)
      resolve(...args)
    })
  })
}

function sink (func) {
  const result = split((data) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
  if (func) result.pipe(writer.obj(func))
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

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

module.exports = {
  expected,
  sink,
  check,
  once,
  sleep
}
