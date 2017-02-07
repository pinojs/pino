'use strict'

var stringifySafe = require('fast-safe-stringify')
var EventEmitter = require('events').EventEmitter
var fs = require('fs')
var pump = require('pump')
var flatstr = require('flatstr')
var pretty = require('./pretty')
var events = require('./lib/events')
var levels = require('./lib/levels')
var tools = require('./lib/tools')
var serializers = require('./lib/serializers')

var LOG_VERSION = 1

var defaultOptions = {
  safe: true,
  name: undefined,
  serializers: {},
  timestamp: true,
  slowtime: false,
  extreme: false,
  level: 'info',
  levelVal: undefined,
  prettyPrint: false,
  enabled: true
}

function pino (opts, stream) {
  var iopts = opts
  var istream = stream
  if (iopts && (iopts.writable || iopts._writableState)) {
    istream = iopts
    iopts = defaultOptions
  }
  iopts = Object.assign({}, defaultOptions, iopts)
  if (iopts.extreme && iopts.prettyPrint) throw Error('cannot enable pretty print in extreme mode')
  istream = istream || process.stdout
  if (iopts.prettyPrint) {
    var pstream = pretty(iopts.prettyPrint)
    var origStream = istream
    pump(pstream, origStream, function (err) {
      if (err) logger.emit('error', err)
    })
    istream = pstream
  }

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
      if (!tools.streamIsBlockable(istream)) {
        logger.emit('error', new Error('stream must have a file descriptor in extreme mode'))
      }
    }, 100)

    events.onExit(function (code, evt) {
      var buf = iopts.cache.buf
      if (buf) {
        // We need to block the process exit long enough to flush the buffer
        // to the destination stream. We do that by forcing a synchronous
        // write directly to the stream's file descriptor.
        var fd = (istream.fd) ? istream.fd : istream._handle.fd
        fs.writeSync(fd, buf)
      }
      if (!process._events[evt] || process._events[evt].length < 2 || !process._events[evt].filter(function (f) {
        return f + '' !== events.onExit.passCode + '' && f + '' !== events.onExit.insertCode + ''
      }).length) {
        process.exit(code)
      } else {
        return 'no exit'
      }
    })
  }

  return logger
}

tools.defineLevelsProperty(pino)

function Pino (opts, stream) {
  // We define the levels property at construction so that state does
  // not get shared between instances.
  tools.defineLevelsProperty(this)
  this.stream = stream
  tools.applyOptions.call(this, opts)
}

Pino.prototype = new EventEmitter()

Pino.prototype.fatal = tools.genLog(levels.levels.fatal)
Pino.prototype.error = tools.genLog(levels.levels.error)
Pino.prototype.warn = tools.genLog(levels.levels.warn)
Pino.prototype.info = tools.genLog(levels.levels.info)
Pino.prototype.debug = tools.genLog(levels.levels.debug)
Pino.prototype.trace = tools.genLog(levels.levels.trace)

Object.defineProperty(Pino.prototype, 'levelVal', {
  get: function getLevelVal () {
    return this._levelVal
  },
  set: function setLevelVal (num) {
    if (typeof num === 'string') { return this._setLevel(num) }

    if (this.emit) {
      this.emit('level-change', this.levels.labels[num], num, this.levels.labels[this._levelVal], this._levelVal)
    }

    this._levelVal = num

    for (var key in this.levels.values) {
      if (num > this.levels.values[key]) {
        this[key] = tools.noop
        continue
      }
      this[key] = levels.isStandardLevel(key) ? Pino.prototype[key] : tools.genLog(this.levels.values[key])
    }
  }
})

Pino.prototype._setLevel = function _setLevel (level) {
  if (typeof level === 'number') {
    if (!isFinite(level)) {
      throw Error('unknown level ' + level)
    }
    level = this.levels.labels[level]
  }

  if (!this.levels.values[level]) {
    throw Error('unknown level ' + level)
  }
  this.levelVal = this.levels.values[level]
}

Pino.prototype._getLevel = function _getLevel (level) {
  return this.levels.labels[this.levelVal]
}

Object.defineProperty(Pino.prototype, 'level', {
  get: Pino.prototype._getLevel,
  set: Pino.prototype._setLevel
})

Object.defineProperty(Pino.prototype, '_lscache', {
  value: tools.copy({}, levels.lscache)
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
  var data = this._baseLog + this._lscache[num] + this.time()
  // to catch both null and undefined
  /* eslint-disable eqeqeq */
  if (msg != undefined) {
    data += ',"msg":' + JSON.stringify('' + msg)
  }
  var value
  if (obj) {
    if (obj.stack) {
      data += ',"type":"Error","stack":' + this.stringify(obj.stack)
    }
    for (var key in obj) {
      value = obj[key]
      if ((!obj.hasOwnProperty || obj.hasOwnProperty(key)) && value !== undefined) {
        value = this.stringify(this.serializers[key] ? this.serializers[key](value) : value)
        if (value !== undefined) {
          data += ',"' + key + '":' + value
        }
      }
    }
  }
  return data + this.chindings + this.end
}

Pino.prototype.child = function child (bindings) {
  if (!bindings) {
    throw Error('missing bindings for child Pino')
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
    levelVal: levels.isStandardLevelVal(this.levelVal) ? undefined : this.levelVal,
    serializers: bindings.hasOwnProperty('serializers') ? Object.assign(this.serializers, bindings.serializers) : this.serializers,
    stringify: this.stringify,
    end: this.end,
    name: this.name,
    timestamp: this.timestamp,
    slowtime: this.slowtime,
    chindings: data,
    cache: this.cache,
    formatOpts: this.formatOpts
  }

  var _child = Object.create(this)
  _child.stream = this.stream
  tools.applyOptions.call(_child, opts)
  return _child
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

Pino.prototype.addLevel = function addLevel (name, lvl) {
  if (this.levels.values.hasOwnProperty(name)) return false
  if (this.levels.labels.hasOwnProperty(lvl)) return false
  this.levels.values[name] = lvl
  this.levels.labels[lvl] = name
  this._lscache[lvl] = flatstr('"level":' + Number(lvl))
  this[name] = tools.genLog(lvl)
  return true
}

module.exports = pino
module.exports.stdSerializers = {
  req: serializers.asReqValue,
  res: serializers.asResValue,
  err: serializers.asErrValue
}
module.exports.pretty = pretty
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
