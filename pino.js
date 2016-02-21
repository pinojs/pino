'use strict'

var stringifySafe = require('json-stringify-safe')
var is = require('core-util-is') // eslint-disable-line no-unused-vars
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

function sermon (stream, opts) {
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
    // needed because we cannot put arguments manipulation
    // in another function without paying a perf drop

    eval('' + // eslint-disable-line no-eval
      'funcs.' + key + ' = function ' + key + ' () {\n' +
      '  var base = 0\n' +
      '  var obj = null\n' +
      '  var msg // so it does not happear in the json\n' +
      '  if (is.isObject(arguments[0])) {\n' +
      '    obj = arguments[0]\n' +
      '    base += 1\n' +
      '  }\n' +
      '  var toFormat = new Array(arguments.length - base)\n' +
      '  for (var i = base; i < arguments.length; i++) {\n' +
      '    toFormat[i - base] = arguments[i]\n' +
      '  }\n' +
      '  if (toFormat.length > 0) {\n' +
      '    msg = format.apply(null, toFormat)\n' +
      '  }\n' +
      '  stream.write(asJson(obj, msg, ' + levels[key] + ' ))\n' +
      '}'
    )
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

module.exports = sermon
