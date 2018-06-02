'use strict'

const os = require('os')
const { EventEmitter } = require('events')
const stringifySafe = require('fast-safe-stringify')
const serializers = require('pino-std-serializers')
const flatstr = require('flatstr')
const SonicBoom = require('sonic-boom')
const events = require('./lib/events')
const redact = require('./lib/redact')
const time = require('./lib/time')
const needsMetadata = Symbol.for('needsMetadata')
const {
  isStandardLevelVal,
  isStandardLevel,
  lscache,
  levels
} = require('./lib/levels')
const {
  applyOptions,
  genLog,
  copy,
  asMetaWrapper,
  defineLevelsProperty,
  noop
} = require('./lib/tools')
const { version } = require('./package.json')

const LOG_VERSION = 1

const defaultOptions = {
  safe: true,
  name: undefined,
  serializers: {},
  redact: null,
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

const pinoPrototype = Object.create(EventEmitter.prototype, {
  silent: {
    value: noop,
    enumerable: true
  },
  stream: {
    value: process.stdout,
    writable: true
  },
  pino: {
    value: version,
    enumerable: true
  },
  levelVal: {
    get: getLevelVal,
    set: setLevelVal
  },
  level: {
    get: _getLevel,
    set: _setLevel
  },
  _getLevel: {
    value: _getLevel
  },
  _setLevel: {
    value: _setLevel
  },
  _lscache: {
    value: copy({}, lscache)
  },
  LOG_VERSION: {
    value: LOG_VERSION
  },
  asJson: {
    enumerable: true,
    value: asJson
  },
  child: {
    enumerable: true,
    value: child
  },
  write: {
    value: pinoWrite
  },
  flush: {
    enumerable: true,
    value: flush
  },
  addLevel: {
    enumerable: true,
    value: addLevel
  },
  isLevelEnabled: {
    enumerable: true,
    value: isLevelEnabled
  }
})

const levelMethods = ['fatal', 'error', 'warn', 'info', 'debug', 'trace']
for (const m of levelMethods) pinoPrototype[m] = genLog(levels[m])

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
      this[key] = noop
      continue
    }
    this[key] = isStandardLevel(key) ? pinoPrototype[key] : genLog(this.levels.values[key])
  }
}

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

function _getLevel (level) {
  return this.levels.labels[this.levelVal]
}

// magically escape strings for json
// relying on their charCodeAt
// everything below 32 needs JSON.stringify()
// 34 and 92 happens all the time, so we
// have a fast case for them
function asString (str) {
  var result = ''
  var last = 0
  var l = str.length
  var point = 255
  if (l > 42) {
    return JSON.stringify(str)
  }
  for (var i = 0; i < l && point >= 32; i++) {
    point = str.charCodeAt(i)
    if (point === 34 || point === 92) {
      result += str.slice(last, i) + '\\'
      last = i
    }
  }
  if (last === 0) {
    result = str
  } else {
    result += str.slice(last)
  }
  return point < 32 ? JSON.stringify(str) : '"' + result + '"'
}

function asJson (obj, msg, num, time) {
  // to catch both null and undefined
  var hasObj = obj !== undefined && obj !== null
  var objError = hasObj && obj instanceof Error
  msg = !msg && objError ? obj.message : msg || undefined
  var data = this._lscache[num] + time
  if (msg !== undefined) {
    data += this.messageKeyString + asString('' + msg)
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
  if (stream instanceof SonicBoom) {
    stream.write(s)
  } else {
    stream.write(flatstr(s))
  }
}

function flush () {
  if (!this.stream.flushSync) return
  this.stream.flushSync()
}

function addLevel (name, lvl) {
  if (this.levels.values.hasOwnProperty(name)) return false
  if (this.levels.labels.hasOwnProperty(lvl)) return false
  this.levels.values[name] = lvl
  this.levels.labels[lvl] = name
  this._lscache[lvl] = flatstr('{"level":' + Number(lvl))
  this[name] = lvl < this._levelVal ? noop : genLog(lvl)
  return true
}

function isLevelEnabled (logLevel) {
  var logLevelVal = this.levels.values[logLevel]
  return logLevelVal && (logLevelVal >= this._levelVal)
}

function getPrettyStream (opts, prettifier, dest) {
  if (prettifier && typeof prettifier === 'function') {
    return asMetaWrapper(prettifier(opts), dest)
  }
  try {
    var prettyFactory = require('pino-pretty')
    return asMetaWrapper(prettyFactory(opts), dest)
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
  iopts.stringifiers = iopts.redact ? redact(iopts.redact, iopts.stringify) : {}
  iopts.formatOpts = iopts.redact
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
  defineLevelsProperty(instance)

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

defineLevelsProperty(pino)

function extreme (dest = process.stdout.fd) {
  return new SonicBoom(dest, 4096)
}

function destination (dest = process.stdout.fd) {
  return new SonicBoom(dest)
}

pino.stdSerializers = {
  req: serializers.req,
  res: serializers.res,
  err: serializers.err,
  wrapRequestSerializer: serializers.wrapRequestSerializer,
  wrapResponseSerializer: serializers.wrapResponseSerializer
}

pino.extreme = extreme
pino.destination = destination

pino.stdTimeFunctions = Object.assign({}, time)

Object.defineProperty(
  pino,
  'LOG_VERSION',
  {
    value: LOG_VERSION,
    enumerable: true
  }
)

module.exports = pino
