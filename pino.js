'use strict'

var stringifySafe = require('fast-safe-stringify')
var format = require('quick-format')
var os = require('os')
var flatstr = require('flatstr')
var once = require('once')
var noop = require('./noop')
var pid = process.pid
var hostname = os.hostname()
var baseLog = flatstr('{"pid":' + pid + ',"hostname":"' + hostname + '",')
var extend = require('object.assign').getPolyfill()

var LOG_VERSION = 1

var levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}

// private property
Object.defineProperty(levels, 'silent', {
  value: 100,
  enumerable: false
})

var nums = Object.keys(levels).reduce(function (o, k) {
  o[levels[k]] = k
  return o
}, {})

// level string catch
var lscache = Object.keys(nums).reduce(function (o, k) {
  o[k] = flatstr('"level":' + Number(k) + ',"time":')
  return o
}, {})

// private property
Object.defineProperty(nums, '100', {
  value: 'silent',
  enumerable: false
})

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
  var formatOpts = safe ? null : {lowres: true}
  var name = opts.name
  var level = opts.level || 'info'
  var serializers = opts.serializers || {}
  var end = ',"v":' + LOG_VERSION + '}\n'
  var cache = !opts.extreme ? null : {
    size: 4096,
    buf: ''
  }

  if (opts.enabled === false) {
    level = 'silent'
  }

  var logger = new Pino(level, stream, serializers, stringify, end, name, slowtime, '', cache, formatOpts)
  if (cache) {
    onExit(function (code, evt) {
      if (cache.buf) {
        if (stream === process.stdout) {
          console.log(cache.buf)
        } else if (stream === process.stderr) {
          console.error(cache.buf)
        } else {
          stream.write(cache.buf)
        }
        cache.buf = ''
      }
      if (!process._events[evt] || process._events[evt].length < 2 || !process._events[evt].filter(function (f) {
        return f + '' !== onExit.passCode + '' && f + '' !== onExit.insertCode + ''
      }).length) {
        process.exit(code)
      } else {
        return 'no exit'
      }
    })
  }

  return logger
}

Object.defineProperty(pino, 'levels', {
  value: {
    values: copy({}, levels),
    labels: copy({}, nums)
  },
  enumerable: true
})

function Pino (level, stream, serializers, stringify, end, name, slowtime, chindings, cache, formatOpts) {
  this.stream = stream
  this.serializers = serializers
  this.stringify = stringify
  this.end = end
  this.name = name
  this.slowtime = slowtime
  this.chindings = chindings
  this.cache = cache
  this.formatOpts = formatOpts
  this._setLevel(level)

  this._baseLog = flatstr(baseLog +
    (this.name === undefined ? '' : '"name":' + stringify(this.name) + ','))

  if (slowtime) {
    this.time = getSlowTime
  } else {
    this.time = getTime
  }
}

if (require('eve' + 'nts')) {
  Pino.prototype = new (require('eve' + 'nts').EventEmitter)()
}

Pino.prototype.fatal = genLog(levels.fatal)
Pino.prototype.error = genLog(levels.error)
Pino.prototype.warn = genLog(levels.warn)
Pino.prototype.info = genLog(levels.info)
Pino.prototype.debug = genLog(levels.debug)
Pino.prototype.trace = genLog(levels.trace)

Object.defineProperty(Pino.prototype, 'levels', {value: pino.levels})

Object.defineProperty(Pino.prototype, 'levelVal', {
  get: function getLevelVal () {
    return this._levelVal
  },
  set: function setLevelVal (num) {
    if (typeof num === 'string') { return this._setLevel(num) }

    if (this.emit) {
      this.emit('level-change', nums[num], num, nums[this._levelVal], this._levelVal)
    }

    this._levelVal = num

    for (var key in levels) {
      if (num > levels[key]) {
        this[key] = noop
        continue
      }
      this[key] = Pino.prototype[key]
    }
  }
})

Pino.prototype._setLevel = function _setLevel (level) {
  if (typeof level === 'number') { level = nums[level] }

  if (!levels[level]) {
    throw new Error('unknown level ' + level)
  }
  this.levelVal = levels[level]
}

Pino.prototype._getLevel = function _getLevel (level) {
  return nums[this.levelVal]
}

Object.defineProperty(Pino.prototype, 'level', {
  get: Pino.prototype._getLevel,
  set: Pino.prototype._setLevel
})

Object.defineProperty(
  Pino.prototype,
  'LOG_VERSION',
  {value: LOG_VERSION}
)

function fastRep (s) {
  var str = s.toString()
  var result = ''
  var last = 0
  var l = str.length
  for (var i = 0; i < l; i++) {
    if (str[i] === '"') {
      result += str.slice(last, i) + '\\"'
      last = i + 1
    }
  }
  if (last === 0) {
    result = str
  } else {
    result += str.slice(last)
  }
  return result
}

Pino.prototype.asJson = function asJson (obj, msg, num) {
  if (!msg && obj instanceof Error) {
    msg = obj.message
  }
  var data = this._baseLog + lscache[num] + this.time()
  // to catch both null and undefined
  /*eslint-disable eqeqeq*/
  if (msg != undefined) {
    data += ',"msg":"' + fastRep(msg) + '"'
  }
  var value
  if (obj) {
    if (obj.stack) {
      data += ',"type":"Error","stack":' + this.stringify(obj.stack)
    } else {
      for (var key in obj) {
        value = obj[key]
        if (obj.hasOwnProperty(key) && value !== undefined) {
          value = this.serializers[key] ? this.serializers[key](value) : value
          if (value !== undefined) {
            data += ',"' + key + '":' + this.stringify(value)
          }
        }
      }
    }
  }
  return data + this.chindings + this.end
}

function getTime () {
  return Date.now()
}

function getSlowTime () {
  return '"' + (new Date()).toISOString() + '"'
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
    if (key !== 'level' && key !== 'serializers' && bindings.hasOwnProperty(key) && value !== undefined) {
      value = this.serializers[key] ? this.serializers[key](value) : value
      data += '"' + key + '":' + this.stringify(value) + ','
    }
  }
  data = this.chindings + data.substr(0, data.length - 1)

  return new Pino(
    bindings.level || this.level,
    this.stream,
    bindings.hasOwnProperty('serializers') ? extend(this.serializers, bindings.serializers) : this.serializers,
    this.stringify,
    this.end,
    this.name,
    this.slowtime,
    data,
    this.cache,
    this.formatOpts)
}

Pino.prototype.write = function (obj, msg, num) {
  var s = this.asJson(obj, msg, num)
  if (!this.cache) {
    this.stream.write(flatstr(s))
    return
  }

  this.cache.buf += s
  if (this.cache.buf.length > this.cache.size) {
    this.stream.write(flatstr(this.cache.buf))
    this.cache.buf = ''
  }
}

Pino.prototype.flush = function () {
  if (!this.cache) {
    return
  }

  this.stream.write(flatstr(this.cache.buf))
  this.cache.buf = ''
}

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

function genLog (z) {
  return function LOG (a, b, c, d, e, f, g, h, i, j, k) {
    var l = 0
    var m = null
    var n = null
    var o
    var p
    if (typeof a === 'object' && a !== null) {
      m = a
      n = [b, c, d, e, f, g, h, i, j, k]
      l = 1

      if (m.method && m.headers && m.socket) {
        m = mapHttpRequest(m)
      } else if (m.statusCode) {
        m = mapHttpResponse(m)
      }
    } else {
      n = [a, b, c, d, e, f, g, h, i, j, k]
    }
    p = n.length = arguments.length - l
    if (p > 1) {
      o = format(n, this.formatOpts)
    } else if (p) {
      o = n[0]
    }
    this.write(m, o, z)
  }
}

function copy (a, b) {
  for (var k in b) { a[k] = b[k] }
  return a
}

function onExit (fn) {
  var oneFn = once(fn)
  process.on('beforeExit', handle('beforeExit'))
  process.on('exit', handle('exit'))
  process.on('uncaughtException', handle('uncaughtException', 1))
  process.on('SIGHUP', handle('SIGHUP', 129))
  process.on('SIGINT', handle('SIGINT', 130))
  process.on('SIGQUIT', handle('SIGQUIT', 131))
  process.on('SIGTERM', handle('SIGTERM', 143))
  function handle (evt, code) {
    onExit.passCode = function (code) {
      if (oneFn.value) { oneFn = once(fn) }
      oneFn(code, evt)
    }
    onExit.insertCode = function () {
      if (oneFn.value) { oneFn = once(fn) }
      oneFn(code, evt)
    }
    return (code === undefined) ? onExit.passCode : onExit.insertCode
  }
}

module.exports = pino
module.exports.stdSerializers = {
  req: asReqValue,
  res: asResValue,
  err: asErrValue
}
module.exports.pretty = require('./pretty')
Object.defineProperty(
  module.exports,
  'LOG_VERSION',
  {value: LOG_VERSION, enumerable: true}
)
