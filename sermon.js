'use strict'

var stringifySafe = require('json-stringify-safe')
var is = require('core-util-is')
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

  var stringify = opts.safe !== false ? stringifySafe : JSON.stringify
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

  function asJson (obj, msg, num) {
    var data = JSON.stringify(new Message(num, msg))
    if (obj) {
      data = data.slice(0, data.length - 1)
      for (var key in obj) {
        data += ',"' + key + '":' + stringify(obj[key])
      }
      data += '}'
    }
    return data + '\n'
  }

  function fatal (obj, msg) {
    if (!is.isObject(obj)) {
      msg = obj
      obj = null
    }
    stream.write(asJson(obj, msg, 60))
  }

  function error (obj, msg) {
    if (!is.isObject(obj)) {
      msg = obj
      obj = null
    }
    stream.write(asJson(obj, msg, 50))
  }

  function warn (obj, msg) {
    if (!is.isObject(obj)) {
      msg = obj
      obj = null
    }
    stream.write(asJson(obj, msg, 40))
  }

  function info (obj, msg) {
    if (!is.isObject(obj)) {
      msg = obj
      obj = null
    }
    stream.write(asJson(obj, msg, 30))
  }

  function debug (obj, msg) {
    if (!is.isObject(obj)) {
      msg = obj
      obj = null
    }
    stream.write(asJson(obj, msg, 20))
  }

  function trace (obj, msg) {
    if (!is.isObject(obj)) {
      msg = obj
      obj = null
    }
    stream.write(asJson(obj, msg, 10))
  }

  function Message (level, msg) {
    this.pid = pid
    this.hostname = hostname
    this.name = name
    this.level = level
    this.msg = msg && msg.toString()
    this.time = new Date()
    this.v = 0
  }
}

function noop () {}

module.exports = sermon
