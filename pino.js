'use strict'

var os = require('os')
var EventEmitter = require('events').EventEmitter
var stringifySafe = require('fast-safe-stringify')
var serializers = require('pino-std-serializers')
var util = require('util')
var flatstr = require('flatstr')
var SonicBoom = require('sonic-boom')
var events = require('./lib/events')
var levels = require('./lib/levels')
var redact = require('./lib/redact')
var tools = require('./lib/tools')
var time = require('./lib/time')
var needsMetadata = Symbol.for('needsMetadata')
var isStandardLevelVal = levels.isStandardLevelVal
var isStandardLevel = levels.isStandardLevel
var applyOptions = tools.applyOptions

var LOG_VERSION = 1

var defaultOptions = {
  safe: true,
  name: undefined,
  serializers: {},
  redact: [],
  censor: '[Redacted]',
  timestamp: time.epochTime,
  level: 'info',
  levelVal: undefined,
  prettyPrint: false,
  base: {
    pid: process.pid,
    hostname: os.hostname()
  },
  enabled: true,
  onTerminated: function (eventName, err) {
    if (err) return process.exit(1)
    process.exit(0)
  },
  messageKey: 'msg'
}

var pinoPrototype = Object.create(EventEmitter.prototype, {
  silent: {
    value: tools.noop,
    enumerable: true
  },
  stream: {
    value: process.stdout,
    writable: true
  },
  pino: {
    value: require('./package.json').version,
    enumerable: true
  }
})

var levelMethods = ['fatal', 'error', 'warn', 'info', 'debug', 'trace']
levelMethods.forEach(function (m) {
  Object.defineProperty(pinoPrototype, m, {
    value: tools.genLog(levels.levels[m]),
    enumerable: true,
    writable: true
  })
})

function getLevelVal () {
  return this._levelVal
}
function setLevelVal (num) {
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
    this[key] = isStandardLevel(key) ? pinoPrototype[key] : tools.genLog(this.levels.values[key])
  }
}
Object.defineProperty(pinoPrototype, 'levelVal', {
  get: getLevelVal,
  set: setLevelVal
})

function _setLevel (level) {
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
Object.defineProperty(pinoPrototype, '_setLevel', {
  value: _setLevel
})

Object.defineProperty(pinoPrototype, '_getLevel', {
  value: function _getLevel (level) {
    return this.levels.labels[this.levelVal]
  }
})

Object.defineProperty(pinoPrototype, 'level', {
  get: pinoPrototype._getLevel,
  set: pinoPrototype._setLevel
})

Object.defineProperty(pinoPrototype, '_lscache', {
  value: tools.copy({}, levels.lscache)
})

Object.defineProperty(
  pinoPrototype,
  'LOG_VERSION',
  {value: LOG_VERSION}
)

function asJson (obj, msg, num, time) {
  // to catch both null and undefined
  var hasObj = obj !== undefined && obj !== null
  var objError = hasObj && obj instanceof Error
  msg = !msg && objError ? obj.message : msg || undefined
  var data = this._lscache[num] + time
  if (msg !== undefined) {
    // JSON.stringify is safe here
    data += this.messageKeyString + JSON.stringify('' + msg)
  }
  // we need the child bindings added to the output first so that logged
  // objects can take precedence when JSON.parse-ing the resulting log line
  data = data + this.chindings
  var value
  if (hasObj) {
    var notHasOwnProperty = obj.hasOwnProperty === undefined
    if (objError) {
      data += ',"type":"Error","stack":' + this.stringify(obj.stack)
    }
    // if global serializer is set, call it first
    if (this.serializers[Symbol.for('pino.*')]) {
      obj = this.serializers[Symbol.for('pino.*')](obj)
    }
    for (var key in obj) {
      value = obj[key]
      if ((notHasOwnProperty || obj.hasOwnProperty(key)) && value !== undefined) {
        value = (this.stringifiers[key] || this.stringify)(this.serializers[key] ? this.serializers[key](value) : value)
        if (value !== undefined) {
          data += ',"' + key + '":' + value
        }
      }
    }
  }
  return data + this.end
}
Object.defineProperty(pinoPrototype, 'asJson', {
  enumerable: true,
  value: asJson
})

function asChindings (that, bindings) {
  if (!bindings) {
    throw Error('missing bindings for child Pino')
  }
  var key
  var value
  var data = that.chindings
  if (that.serializers[Symbol.for('pino.*')]) {
    bindings = that.serializers[Symbol.for('pino.*')](bindings)
  }
  for (key in bindings) {
    value = bindings[key]
    if (key !== 'level' && key !== 'serializers' && bindings.hasOwnProperty(key) && value !== undefined) {
      value = that.serializers[key] ? that.serializers[key](value) : value
      data += ',"' + key + '":' + (that.stringifiers[key] || that.stringify)(value)
    }
  }
  return data
}

function child (bindings) {
  var opts = {
    chindings: asChindings(this, bindings),
    level: bindings.level || this.level,
    levelVal: isStandardLevelVal(this.levelVal) ? undefined : this.levelVal,
    serializers: bindings.hasOwnProperty('serializers') ? Object.assign({}, this.serializers, bindings.serializers) : this.serializers,
    stringifiers: this.stringifiers
  }

  var _child = Object.create(this)
  _child.stream = this.stream
  applyOptions(_child, opts)
  return _child
}
Object.defineProperty(pinoPrototype, 'child', {
  enumerable: true,
  value: child
})

function pinoWrite (obj, msg, num) {
  var t = this.time()
  var s = this.asJson(obj, msg, num, t)
  var stream = this.stream
  if (stream[needsMetadata]) {
    stream.lastLevel = num
    stream.lastMsg = msg
    stream.lastObj = obj
    stream.lastTime = t.slice(8)
    stream.lastLogger = this // for child loggers
  }
  stream.write(flatstr(s))
}
Object.defineProperty(pinoPrototype, 'write', {
  value: pinoWrite
})

function flush () {
  if (!this.stream.flushSync) {
    return
  }

  this.stream.flushSync()
}
Object.defineProperty(pinoPrototype, 'flush', {
  enumerable: true,
  value: flush
})

function addLevel (name, lvl) {
  if (this.levels.values.hasOwnProperty(name)) return false
  if (this.levels.labels.hasOwnProperty(lvl)) return false
  this.levels.values[name] = lvl
  this.levels.labels[lvl] = name
  this._lscache[lvl] = flatstr('{"level":' + Number(lvl))
  Object.defineProperty(this, name, {
    value: lvl < this._levelVal ? tools.noop : tools.genLog(lvl),
    enumerable: true,
    writable: true
  })

  return true
}
Object.defineProperty(pinoPrototype, 'addLevel', {
  enumerable: true,
  value: addLevel
})

function isLevelEnabled (logLevel) {
  var logLevelVal = this.levels.values[logLevel]
  return logLevelVal && (logLevelVal >= this._levelVal)
}
Object.defineProperty(pinoPrototype, 'isLevelEnabled', {
  enumerable: true,
  value: isLevelEnabled
})

function getPrettyStream (opts, prettifier, dest) {
  if (prettifier && typeof prettifier === 'function') {
    return tools.asMetaWrapper(prettifier(opts), dest)
  }
  try {
    var prettyFactory = require('pino-pretty')
    return tools.asMetaWrapper(prettyFactory(opts), dest)
  } catch (e) {
    throw Error('Missing `pino-pretty` module: `pino-pretty` must be installed separately')
  }
}

function pino (opts, stream) {
  var iopts = opts
  var istream = stream
  if (iopts && (iopts.writable || iopts._writableState || iopts instanceof SonicBoom)) {
    istream = iopts
    iopts = defaultOptions
  }
  iopts = Object.assign({}, defaultOptions, iopts)
  if (iopts.extreme) {
    throw new Error('The extreme option is removed, use require(\'pino\').extreme(dest) instead')
  }
  istream = istream || process.stdout
  var isStdout = istream === process.stdout
  if (isStdout && istream.fd >= 0) {
    istream = new SonicBoom(istream.fd)
  }
  if (iopts.prettyPrint) {
    var prettyOpts = Object.assign({ messageKey: iopts.messageKey }, iopts.prettyPrint)
    var pstream = getPrettyStream(prettyOpts, iopts.prettifier, istream)
    istream = pstream
  }

  // internal options
  iopts.stringify = iopts.safe ? stringifySafe : JSON.stringify
  iopts.stringifiers = (iopts.redact.length > 0) ? redact({
    paths: iopts.redact,
    censor: iopts.censor,
    serialize: iopts.stringify
  }) : {}
  iopts.formatOpts = (iopts.redact.length > 0)
    ? {stringify: iopts.stringifiers[redact.format]}
    : {stringify: iopts.stringify}
  iopts.messageKeyString = `,"${iopts.messageKey}":`
  iopts.end = ',"v":' + LOG_VERSION + '}' + (iopts.crlf ? '\r\n' : '\n')
  iopts.chindings = ''

  if (iopts.enabled === false) {
    iopts.level = 'silent'
  }

  var instance = Object.create(pinoPrototype)
  instance.stream = istream
  tools.defineLevelsProperty(instance)

  instance.stringify = iopts.stringify
  instance.stringifiers = iopts.stringifiers
  instance.end = iopts.end
  instance.name = iopts.name
  instance.timestamp = iopts.timestamp
  instance.formatOpts = iopts.formatOpts
  instance.onTerminated = iopts.onTerminated
  instance.messageKey = iopts.messageKey
  instance.messageKeyString = iopts.messageKeyString

  applyOptions(instance, iopts)

  if (iopts.timestamp && Function.prototype.isPrototypeOf(iopts.timestamp)) {
    instance.time = iopts.timestamp
  } else if (iopts.timestamp) {
    instance.time = time.epochTime
  } else {
    instance.time = time.nullTime
  }

  if (istream instanceof SonicBoom) {
    if (istream.fd === -1) {
      istream.on('ready', function () {
        events(instance, extremeModeExitHandler)
      })
    } else {
      events(instance, extremeModeExitHandler)
    }
  }

  function extremeModeExitHandler () {
    istream.flushSync()
  }

  var base = (typeof iopts.base === 'object') ? iopts.base : defaultOptions.base

  if (iopts.name !== undefined) {
    base = Object.assign({}, base, {
      name: iopts.name
    })
  }

  if (base !== null) {
    instance = instance.child(base)
  }

  return instance
}

tools.defineLevelsProperty(pino)

function extreme (dest) {
  if (!dest) {
    return new SonicBoom(process.stdout.fd, 4096)
  }
  return new SonicBoom(dest, 4096)
}

function destination (dest) {
  if (!dest) {
    return new SonicBoom(process.stdout.fd)
  }
  return new SonicBoom(dest)
}

module.exports = pino
module.exports.stdSerializers = {
  req: serializers.req,
  res: serializers.res,
  err: serializers.err,
  wrapRequestSerializer: serializers.wrapRequestSerializer,
  wrapResponseSerializer: serializers.wrapResponseSerializer
}

Object.defineProperty(module.exports.stdSerializers, 'wrapRespnonseSerializer', {
  enumerable: true,
  get: util.deprecate(
    function () {
      return serializers.wrapResponseSerializer
    },
    '`pino.stdSerializers.wrapRespnonseSerializer` is deprecated: use `pino.stdSerializers.wrapResponseSerializer`'
  )
})

module.exports.extreme = extreme
module.exports.destination = destination

module.exports.stdTimeFunctions = Object.assign({}, time)
Object.defineProperty(
  module.exports,
  'LOG_VERSION',
  {value: LOG_VERSION, enumerable: true}
)
