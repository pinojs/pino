'use strict'

var stringifySafe = require('fast-safe-stringify')
var format = require('quick-format')
var os = require('os')
var pid = process.pid
var hostname = os.hostname()

var LOG_VERSION = 1

var levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}
var nums = Object.keys(levels).reduce(function (o, k) {
  o[levels[k]] = k
  return o
}, {})

function pino (opts, stream) {
  if (opts && opts._writableState) {
    stream = opts
    opts = null
  }
  stream = stream || process.stdout
  opts = opts || {}
  var slowtime = opts.slowtime
  var safe = opts.safe !== false
  var stringify = safe ? stringifySafe : JSON.stringify
  var name = opts.name
  var level = opts.level || 'info'
  var serializers = opts.serializers || {}
  var end = ',"v":' + LOG_VERSION + '}\n'
  return new Pino(level, stream, serializers, stringify, end, name, hostname, slowtime, '')
}

function Pino (level, stream, serializers, stringify, end, name, hostname, slowtime, chindings) {
  this.stream = stream
  this.serializers = serializers
  this.stringify = stringify
  this.end = end
  this.name = name
  this.hostname = hostname
  this.slowtime = slowtime
  this.chindings = chindings
  this._setLevel(level)
}

Pino.prototype.fatal = genLog(levels.fatal)
Pino.prototype.error = genLog(levels.error)
Pino.prototype.warn = genLog(levels.warn)
Pino.prototype.info = genLog(levels.info)
Pino.prototype.debug = genLog(levels.debug)
Pino.prototype.trace = genLog(levels.trace)

Pino.prototype._setLevel = function _setLevel (level) {
  if (typeof level === 'number') { level = nums[level] }
  this._level = levels[level]

  if (!this._level) {
    throw new Error('unknown level ' + level)
  }

  var num = levels[level]
  for (var key in levels) {
    if (num > levels[key]) {
      this[key] = noop
    } else if (this[key] === noop) {
      this[key] = Pino.prototype[key]
    }
  }
}

Pino.prototype._getLevel = function _getLevel (level) {
  return nums[this._level]
}

Object.defineProperty(Pino.prototype, 'level', {
  get: Pino.prototype._getLevel,
  set: Pino.prototype._setLevel
})

Pino.prototype.asJson = function asJson (obj, msg, num) {
  if (!msg && obj instanceof Error) {
    msg = obj.message
  }
  var data = this.message(num, msg)
  var value
  if (obj) {
    if (obj.stack) {
      data += ',"type":"Error","stack":' + this.stringify(obj.stack)
    } else {
      for (var key in obj) {
        value = obj[key]
        if (obj.hasOwnProperty(key) && value !== undefined) {
          value = this.serializers[key] ? this.serializers[key](value) : value
          data += ',"' + key + '":' + this.stringify(value)
        }
      }
    }
  }
  return data + this.chindings + this.end
}
// returns string json with final brace omitted
// the final brace is added by asJson
Pino.prototype.message = function message (level, msg) {
  return '{"pid":' + pid + ',' +
    (this.hostname === undefined ? '' : '"hostname":"' + this.hostname + '",') +
    (this.name === undefined ? '' : '"name":"' + this.name + '",') +
    '"level":' + level + ',' +
    (msg === undefined ? '' : '"msg":"' + (msg && msg.toString()) + '",') +
    '"time":' + (this.slowtime ? '"' + (new Date()).toISOString() + '"' : Date.now())
}

Pino.prototype.child = function child (bindings) {
  if (!bindings) {
    throw new Error('missing bindings for child Pino')
  }

  var data = ','
  var value
  var key
  for (key in bindings) {
    value = bindings[key]
    if (bindings.hasOwnProperty(key) && value !== undefined) {
      value = this.serializers[key] ? this.serializers[key](value) : value
      data += '"' + key + '":' + this.stringify(value) + ','
    }
  }
  data = this.chindings + data.substr(0, data.length - 1)

  return new Pino(this.level, this.stream, this.serializers, this.stringify, this.end, this.name, this.hostname, this.slowtime, data)
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

function asErrValue (err) {
  return {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack
  }
}

function genLog (level) {
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
      msg = format(params, null)
    } else if (len) {
      msg = params[0]
    }
    this.stream.write(this.asJson(obj, msg, level))
  }
}

module.exports = pino

module.exports.stdSerializers = {
  req: asReqValue,
  res: asResValue,
  err: asErrValue
}
