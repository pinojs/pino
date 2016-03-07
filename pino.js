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

function pino (opts, stream) {
  if (opts && opts._writableState) {
    stream = opts
    opts = null
  }
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
  var serializers = opts.serializers || {}

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

  result.level = opts.level || 'info'

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

        if (obj.method && obj.headers && obj.socket) {
          obj = mapHttpRequest(obj)
        } else if (obj.statusCode) {
          obj = mapHttpResponse(obj)
        }
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
    if (!msg && obj instanceof Error) {
      msg = obj.message
    }
    var data = message(num, msg)
    var value
    if (obj) {
      data = data.slice(0, data.length - 1)

      if (obj instanceof Error) {
        data += ',"type":"Error","stack":' + stringify(obj.stack) + '}'
      } else {
        for (var key in obj) {
          value = obj[key]
          if (obj.hasOwnProperty(key) && value !== undefined) {
            value = serializers[key] ? serializers[key](value) : value
            data += ',"' + key + '":' + stringify(value)
          }
        }
        data += '}'
      }
    }
    return data + '\n'
  }

  function message (level, msg) {
    return '{"pid":' + pid + ',' +
      (typeof hostname === 'undefined' ? '' : '"hostname":"' + hostname + '",') +
      (typeof name === 'undefined' ? '' : '"name":"' + name + '",') +
      '"level":' + level + ',' +
      (typeof msg === 'undefined' ? '' : '"msg":"' + (msg && msg.toString()) + '",') +
      '"time":"' + (new Date()).toISOString() + '",' +
      '"v":' + 0 + '}'
  }
}

function noop () {}

function mapHttpRequest (req) {
  return {
    req: asReqValue(req)
  }
}

function mapHttpResponse (res) {
  return {
    res: asResValue(res)
  }
}

function asReqValue (req) {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    remoteAddress: req.connection.remoteAddress,
    remotePort: req.connection.remotePort
  }
}

function asResValue (res) {
  return {
    statusCode: res.statusCode,
    header: res._header
  }
}

module.exports = pino

module.exports.stdSerializers = {
  req: asReqValue,
  res: asResValue
}
