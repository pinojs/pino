'use strict'

var stringifySafe = require('json-stringify-safe')
var format = require('util').format
var os = require('os')
var pid = process.pid
var hostname = os.hostname()

var levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}

function pino (opts, stream) {
  if (opts && opts._writableState) {
    stream = opts
    opts = null
  }
  stream = stream || process.stdout
  opts = opts || {}
  var slowtime = opts.slowtime
  var stringify = opts.safe !== false ? stringifySafe : JSON.stringify
  var name = opts.name
  var level = opts.level
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
  var end = '}\n'

  for (var key in levels) {
    funcs[key] = genLogFunction(key)
  }

  if (opts.meta) {
    end = ',' + opts.meta + end
    Object.keys(levels).forEach(function (key) {
      if (level <= levels[key]) {
        result[key] = funcs[key]
      } else {
        result[key] = noop
      }
    })
  } else {
    setup(result, funcs, level, stream, opts, serializers, stringify)
  }

  return result

  function genLogFunction (key) {
    var level = levels[key]
    return function (a, b, c, d, e, f, g, h, i, j, k) {
      var base = 0
      var obj = null
      var params = null
      var msg
      var len
      if (typeof a === 'object' && a !== null) {
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
      len = params.length = arguments.length - base
      if (len > 1) {
        msg = format.apply(null, params)
      } else if (len) {
        msg = params[0]
      }

      stream.write(asJson(obj, msg, level))
    }
  }

  function asJson (obj, msg, num) {
    if (!msg && obj instanceof Error) {
      msg = obj.message
    }
    var data = message(num, msg)
    var value
    if (obj) {
      if (obj.stack) {
        data += ',"type":"Error","stack":' + stringify(obj.stack)
      } else {
        for (var key in obj) {
          value = obj[key]
          if (obj.hasOwnProperty(key) && value !== undefined) {
            value = serializers[key] ? serializers[key](value) : value
            data += ',"' + key + '":' + stringify(value)
          }
        }
      }
    }
    return data + end
  }

  // returns string json with final brace omitted
  // the final brace is added by asJson
  function message (level, msg) {
    return '{"pid":' + pid + ',' +
      (hostname === undefined ? '' : '"hostname":"' + hostname + '",') +
      (name === undefined ? '' : '"name":"' + name + '",') +
      '"level":' + level + ',' +
      (msg === undefined ? '' : '"msg":"' + (msg && msg.toString()) + '",') +
      '"time":' + (slowtime ? '"' + (new Date()).toISOString() + '"' : Date.now()) + ',' +
      '"v":' + 0
  }
}

function setup (result, funcs, level, stream, opts, serializers, stringify) {
  var safe = opts.safe

  Object.defineProperty(result, 'level', {
    enumerable: false,
    get: function () {
      return level
    },
    set: function (l) {
      level = levels[l]
      if (!level) {
        throw new Error('unknown level ' + l)
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
  result.child = child

  function child (bindings) {
    if (!opts) {
      throw new Error('missing bindings for child logger')
    }

    var data = ''
    var value
    for (var key in bindings) {
      value = bindings[key]
      if (bindings.hasOwnProperty(key) && value !== undefined) {
        value = serializers[key] ? serializers[key](value) : value
        data += '"' + key + '":' + stringify(value)
      }
    }

    var toPino = {
      safe: safe,
      meta: data,
      level: level,
      serializers: serializers
    }

    return pino(toPino, stream)
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
