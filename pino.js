'use strict'

var stringifySafe = require('fast-safe-stringify')
var format = require('quick-format-unescaped')
var EventEmitter = require('events').EventEmitter
var os = require('os')
var fs = require('fs')
var flatstr = require('flatstr')
var once = require('once')
var util = require('util')
var pid = process.pid
var hostname = os.hostname()
var baseLog = flatstr('{"pid":' + pid + ',"hostname":"' + hostname + '",')
var extend = require('object.assign').getPolyfill()

var LOG_VERSION = 1

var defaultOptions = {
  safe: true,
  name: undefined,
  serializers: {},
  timestamp: true,
  slowtime: false,
  extreme: false,
  level: 'info',
  enabled: true
}

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

// level string catch
var lscache = Object.keys(nums).reduce(function (o, k) {
  o[k] = flatstr('"level":' + Number(k))
  return o
}, {})

function streamIsBlockable (s) {
  if (s.hasOwnProperty('_handle') && s._handle.hasOwnProperty('fd') && s._handle.fd) return true
  if (s.hasOwnProperty('fd') && s.fd) return true
  return false
}

function pino (opts, stream) {
  var iopts = opts
  var istream = stream
  if (iopts && (iopts.writable || iopts._writableState)) {
    istream = iopts
    iopts = defaultOptions
  }
  istream = istream || process.stdout
  iopts = extend({}, defaultOptions, iopts)

  // internal options
  iopts.stringify = iopts.safe ? stringifySafe : JSON.stringify
  iopts.formatOpts = {lowres: true}
  iopts.end = ',"v":' + LOG_VERSION + '}\n'
  iopts.cache = !iopts.extreme ? null : {
    size: 4096,
    buf: ''
  }
  iopts.chindings = ''

  if (iopts.enabled === false) {
    iopts.level = 'silent'
  }

  var logger = new Pino(iopts, istream)
  if (iopts.cache) {
    // setImmediate is causing a very weird crash:
    //    Assertion failed: (cb_v->IsFunction()), function MakeCallback...
    // but setTimeout isn't *shrug*
    setTimeout(function () {
      if (!streamIsBlockable(istream)) {
        logger.emit('error', new Error('stream must have a file descriptor in extreme mode'))
      }
    }, 100)

    onExit(function (code, evt) {
      var buf = iopts.cache.buf
      if (buf) {
        // We need to block the process exit long enough to flush the buffer
        // to the destination stream. We do that by forcing a synchronous
        // write directly to the stream's file descriptor.
        var fd = (istream.fd) ? istream.fd : istream._handle.fd
        fs.writeSync(fd, buf)
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
Object.defineProperty(pino.levels.values, 'silent', {value: 100})
Object.defineProperty(pino.levels.labels, '100', {value: 'silent'})

pino.addLevel = function addLevel (name, lvl) {
  if (pino.levels.values.hasOwnProperty(name)) return false
  if (pino.levels.labels.hasOwnProperty(lvl)) return false
  pino.levels.values[name] = lvl
  pino.levels.labels[lvl] = name
  lscache[lvl] = flatstr('"level":' + Number(lvl))
  Pino.prototype[name] = genLog(lvl)
  return true
}

function Pino (opts, stream) {
  this.stream = stream
  this.serializers = opts.serializers
  this.stringify = opts.stringify
  this.end = opts.end
  this.name = opts.name
  this.timestamp = opts.timestamp
  this.slowtime = opts.slowtime
  this.chindings = opts.chindings
  this.cache = opts.cache
  this.formatOpts = opts.formatOpts
  this._setLevel(opts.level)
  this._baseLog = flatstr(baseLog +
    (this.name === undefined ? '' : '"name":' + this.stringify(this.name) + ','))

  if (opts.timestamp === false) {
    this.time = getNoTime
  } else if (opts.slowtime) {
    this.time = getSlowTime
  } else {
    this.time = getTime
  }
}

Pino.prototype = new EventEmitter()

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
      this.emit('level-change', pino.levels.labels[num], num, pino.levels.labels[this._levelVal], this._levelVal)
    }

    this._levelVal = num

    for (var key in pino.levels.values) {
      if (num > pino.levels.values[key]) {
        this[key] = noop
        continue
      }
      this[key] = Pino.prototype[key]
    }
  }
})

Pino.prototype._setLevel = function _setLevel (level) {
  if (typeof level === 'number') { level = pino.levels.labels[level] }

  if (!pino.levels.values[level]) {
    throw new Error('unknown level ' + level)
  }
  this.levelVal = pino.levels.values[level]
}

Pino.prototype._getLevel = function _getLevel (level) {
  return pino.levels.labels[this.levelVal]
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

Pino.prototype.asJson = function asJson (obj, msg, num) {
  if (!msg && obj instanceof Error) {
    msg = obj.message
  }
  var data = this._baseLog + lscache[num] + this.time()
  // to catch both null and undefined
  /* eslint-disable eqeqeq */
  if (msg != undefined) {
    data += ',"msg":' + JSON.stringify(msg)
  }
  var value
  if (obj) {
    if (obj.stack) {
      data += ',"type":"Error","stack":' + this.stringify(obj.stack)
    }
    for (var key in obj) {
      value = obj[key]
      if (obj.hasOwnProperty(key) && value !== undefined) {
        value = this.stringify(this.serializers[key] ? this.serializers[key](value) : value)
        if (value !== undefined) {
          data += ',"' + key + '":' + value
        }
      }
    }
  }
  return data + this.chindings + this.end
}

function getNoTime () {
  return ''
}

function getTime () {
  return ',"time":' + Date.now()
}

function getSlowTime () {
  return ',"time":"' + (new Date()).toISOString() + '"'
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

  var opts = {
    level: bindings.level || this.level,
    serializers: bindings.hasOwnProperty('serializers') ? extend(this.serializers, bindings.serializers) : this.serializers,
    stringify: this.stringify,
    end: this.end,
    name: this.name,
    timestamp: this.timestamp,
    slowtime: this.slowtime,
    chindings: data,
    cache: this.cache,
    formatOpts: this.formatOpts
  }

  return new Pino(opts, this.stream)
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
  var obj = {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack
  }
  for (var key in err) {
    if (obj[key] === undefined) {
      obj[key] = err[key]
    }
  }
  return obj
}

function countInterp (s, i) {
  var n = 0
  var pos = 0
  while (true) {
    pos = s.indexOf(i, pos)
    if (pos >= 0) {
      ++n
      pos += 2
    } else break
  }
  return n
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
      l = typeof a === 'string' ? countInterp(a, '%j') : 0
      if (l) {
        n.length = l + countInterp(a, '%d') + countInterp(a, '%s') + 1
        o = String(util.format.apply(null, n))
      } else {
        o = format(n, this.formatOpts)
      }
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

function noop () {}

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

// This is an internal API. It can change at any time, including semver-minor.
// Use it at your own risk.
Object.defineProperty(
  module.exports,
  '_Pino',
  {value: Pino}
)
