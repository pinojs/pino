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
  levels,
  nums,
  levelMethods,
  setLevelVal,
  getLevelVal,
  _getLevel,
  _setLevel,
  addLevel,
  isLevelEnabled
} = require('./lib/levels')
const {
  copy,
  defineLevelsProperty,
  noop,
  getPrettyStream,
  asChindings,
  asJson
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

const getLevelSym = Symbol('pino-level-getter')
const setLevelSym = Symbol('pino-level-setter')

const getLevelValSym = Symbol('pino-level-val-getter')
const setLevelValSym = Symbol('pino-level-val-setter')

const pinoPrototype = {
  silent: noop,
  stream: process.stdout,
  pino: version,
  get levelVal () { return this[getLevelValSym]() },
  set levelVal (num) { return this[setLevelValSym](num) },
  get level () { return this._getLevel() },
  set level (lvl) { return this._setLevel(lvl) },
  _lscache: copy({}, lscache),
  [getLevelSym]: _getLevel,
  [setLevelSym]: _setLevel,
  [getLevelValSym]: getLevelVal,
  [setLevelValSym]: setLevelVal,
  _getLevel,
  _setLevel,
  asJson,
  child,
  write,
  flush,
  addLevel,
  isLevelEnabled,
  LOG_VERSION
}
Object.setPrototypeOf(pinoPrototype, EventEmitter.prototype)
Object.assign(pinoPrototype, levelMethods)

module.exports = pino

defineLevelsProperty(pino, {levels, nums})

pino.extreme = (dest = process.stdout.fd) => new SonicBoom(dest, 4096)
pino.destination = (dest = process.stdout.fd) => new SonicBoom(dest)

pino.stdSerializers = Object.assign({}, serializers)
pino.stdTimeFunctions = Object.assign({}, time)

pino.LOG_VERSION = LOG_VERSION

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
  defineLevelsProperty(instance, {levels, nums})

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

function applyOptions (self, opts) {
  self.serializers = opts.serializers
  self.chindings = opts.chindings

  if (opts.level && opts.levelVal) {
    const levelIsStandard = isStandardLevel(opts.level)
    const valIsStandard = isStandardLevelVal(opts.levelVal)
    if (valIsStandard) throw Error('level value is already used: ' + opts.levelVal)
    if (levelIsStandard === false && valIsStandard === false) self.addLevel(opts.level, opts.levelVal)
  }
  self._setLevel(opts.level)
}

function child (bindings) {
  const { stream, level, levelVal, serializers, stringifiers } = this
  const chindings = asChindings(this, bindings)
  const opts = {
    chindings,
    stringifiers,
    level: bindings.level || level,
    levelVal: isStandardLevelVal(levelVal) ? undefined : levelVal,
    serializers: bindings.hasOwnProperty('serializers')
      ? Object.assign({}, serializers, bindings.serializers)
      : serializers
  }

  const _child = Object.create(this)
  _child.stream = stream
  applyOptions(_child, opts)
  return _child
}

function write (obj, msg, num) {
  const t = this.time()
  const s = this.asJson(obj, msg, num, t)
  const { stream } = this
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
