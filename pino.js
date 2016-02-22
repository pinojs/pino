'use strict'

var stringifySafe = require('json-stringify-safe')
var format = require('util').format  // eslint-disable-line no-unused-vars
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

function pino (stream, opts) {
  stream = stream || process.stdout
  opts = opts || {}

  var stringify = opts.safe !== false ? stringifySafe : JSON.stringify
  var name = opts.name
  var level
  var funcs = {}
  var result = {
    fatal: null,
    error: null,
    warn: null,
    info: null,
    debug: null,
    trace: null
  }

  for (var key in levels) {
    funcs[key] = genLogFunction(key)
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

  function genLogFunction (key) {
    var level = levels[key]
    return function (a, b, c, d, e, f, g, h, i, j, k) {
      var base = 0
      var obj = null
      var params = null
      var msg
      if (Object(a) === a) {
        obj = a
        params = [b, c, d, e, f, g, h, i, j, k]
        base = 1
      } else {
        params = [a, b, c, d, e, f, g, h, i, j, k]
      }
      if ((params.length = arguments.length - base) > 0) {
        msg = format.apply(null, params)
      }

      stream.write(asJson(obj, msg, level))
    }
  }

  function asJson (obj, msg, num) { // eslint-disable-line no-unused-vars
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

module.exports = pino
