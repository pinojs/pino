'use strict'

var stringifySafe = require('json-stringify-safe')
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
        msg = format(params)
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

var inspect = require('util').inspect

// Did not inline format called from  (target text too big).
function format (args) {
  var f = args[0]
  var argLen = args.length

  var str = ''
  var a = 1
  var lastPos = 0
  for (var i = 0; i < f.length;) {
    if (f.charCodeAt(i) === 37 && i + 1 < f.length) {
      switch (f.charCodeAt(i + 1)) {
        case 100: // 'd'
          if (a >= argLen) { break }
          if (lastPos < i) {
            str += f.slice(lastPos, i)
          }
          str += Number(args[a++])
          lastPos = i = i + 2
          continue
        case 106: // 'j'
          if (a >= argLen) {
            break
          }
          if (lastPos < i) {
            str += f.slice(lastPos, i)
          }
          str += stringifySafe(args[a++])
          lastPos = i = i + 2
          continue
        case 115: // 's'
          if (a >= argLen) {
            break
          }
          if (lastPos < i) {
            str += f.slice(lastPos, i)
          }
          str += String(args[a++])
          lastPos = i = i + 2
          continue
        case 37: // '%'
          if (lastPos < i) {
            str += f.slice(lastPos, i)
          }
          str += '%'
          lastPos = i = i + 2
          continue
      }
    }
    ++i
  }
  if (lastPos === 0) {
    str = f
  } else if (lastPos < f.length) {
    str += f.slice(lastPos)
  }
  while (a < argLen) {
    var x = args[a++]
    if (x === null || (typeof x !== 'object' && typeof x !== 'symbol')) {
      str += ' ' + x
    } else {
      str += ' ' + inspect(x)
    }
  }
  return str
}

// Did not inline format called from  (target AST is too large [early]).
// function format(e){for(var t=e[0],c=e.length,i="",n=1,r=0,o=0;o<t.length;){if(37===t.charCodeAt(o)&&o+1<t.length)switch(t.charCodeAt(o+1)){case 100:if(n>=c)break;o>r&&(i+=t.slice(r,o)),i+=Number(e[n++]),r=o+=2;continue;case 106:if(n>=c)break;o>r&&(i+=t.slice(r,o)),i+=stringifySafe(e[n++]),r=o+=2;continue;case 115:if(n>=c)break;o>r&&(i+=t.slice(r,o)),i+=String(e[n++]),r=o+=2;continue;case 37:o>r&&(i+=t.slice(r,o)),i+="%",r=o+=2;continue}++o}for(0===r?i=t:r<t.length&&(i+=t.slice(r));c>n;){var a=e[n++];i+=null===a||"object"!=typeof a&&"symbol"!=typeof a?" "+a:" "+inspect(a)}return i}
