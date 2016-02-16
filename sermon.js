'use strict'

var os = require('os')
var pid = process.pid
var hostname = os.hostname()

var levels = {
  'fatal': 60,
  'error': 50,
  'warn': 40,
  'info': 30,
  'debug': 20,
  'trace': 10
}

function sermon (stream, opts) {
  stream = stream || process.stdout
  opts = opts || {}

  var name = opts.name
  var level
  var funcs = {
    fatal: fatal,
    error: error,
    warn: warn,
    info: info,
    debug: debug,
    trace: trace
  }
  var result = {
    fatal: null,
    error: null,
    warn: null,
    info: null,
    debug: null,
    trace: null
  }

  Object.defineProperty(result, 'level', {
    enumerable: false,
    get: function () {
      return level
    },
    set: function (l) {
      level = levels[l]
      if (!level) {
        throw new Error('unkown level ' + l)
      }

      Object.keys(levels).forEach(function (key) {
        if (level <= levels[key]) {
          result[key] = funcs[key]
        } else {
          result[key] = noop
        }
      })
    }
  })

  result.level = 'info'

  return result

  function fatal (msg) {
    stream.write(JSON.stringify(new Message(60, msg)) + '\n')
  }

  function error (msg) {
    stream.write(JSON.stringify(new Message(50, msg)) + '\n')
  }

  function warn (msg) {
    stream.write(JSON.stringify(new Message(40, msg)) + '\n')
  }

  function info (msg) {
    stream.write(JSON.stringify(new Message(30, msg)) + '\n')
  }

  function debug (msg) {
    stream.write(JSON.stringify(new Message(20, msg)) + '\n')
  }

  function trace (msg) {
    stream.write(JSON.stringify(new Message(10, msg)) + '\n')
  }

  function Message (level, msg) {
    this.pid = pid
    this.hostname = hostname
    this.name = name
    this.level = level
    this.msg = msg
    this.time = new Date()
    this.v = 0
  }
}

function noop () {}

module.exports = sermon
