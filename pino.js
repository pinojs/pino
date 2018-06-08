'use strict'

const os = require('os')
const { EventEmitter } = require('events')
const stringifySafe = require('fast-safe-stringify')
const serializers = require('pino-std-serializers')
const flatstr = require('flatstr')
const SonicBoom = require('sonic-boom')
const events = require('./lib/events')
const redaction = require('./lib/redaction')
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

function create (opts, stream) {
  var iopts = opts
  if (iopts && (iopts.writable || iopts._writableState || iopts instanceof SonicBoom)) {
    stream = iopts
    iopts = defaultOptions
  }
  iopts = Object.assign({}, defaultOptions, iopts)

  if (iopts.enabled === false) iopts.level = 'silent'

  const {
    base,
    prettyPrint,
    messageKey,
    prettifier,
    extreme,
    safe,
    redact,
    crlf,
    level,
    serializers,
    name,
    timestamp,
    onTerminated,
    levelVal
  } = iopts

  if (extreme) {
    throw new Error('The extreme option has been removed, use require(\'pino\').extreme(dest) instead')
  }
  stream = stream || process.stdout
  if (stream === process.stdout && stream.fd >= 0) {
    stream = new SonicBoom(stream.fd)
  }
  if (prettyPrint) {
    const prettyOpts = Object.assign({ messageKey }, prettyPrint)
    stream = getPrettyStream(prettyOpts, prettifier, stream)
  }

  // internal options
  const stringify = safe ? stringifySafe : JSON.stringify
  const stringifiers = redact ? redaction(redact, stringify) : {}
  const formatOpts = redact
    ? {stringify: stringifiers[redaction.format]}
    : { stringify }
  const messageKeyString = `,"${messageKey}":`
  const end = ',"v":' + LOG_VERSION + '}' + (crlf ? '\r\n' : '\n')
  const chindings = ''

  return {
    instance: {
      time: (timestamp && Function.prototype.isPrototypeOf(timestamp))
        ? timestamp : (timestamp ? time.epochTime : time.nullTime),
      stream,
      stringify,
      stringifiers,
      end,
      timestamp,
      formatOpts,
      onTerminated,
      messageKey,
      messageKeyString
    },
    cfg: {
      base,
      name,
      serializers,
      chindings,
      level,
      levelVal
    }
  }
}

function pino (opts, stream) {
  var { instance, cfg } = create(opts, stream)
  const { base, name, serializers, chindings, level, levelVal } = cfg

  Object.setPrototypeOf(instance, pinoPrototype)
  defineLevelsProperty(instance, {levels, nums})

  configure(instance, {serializers, chindings, level, levelVal})

  if (instance.stream instanceof SonicBoom) {
    if (instance.stream.fd === -1) {
      instance.stream.on('ready', function () {
        events(instance, extremeModeExitHandler)
      })
    } else {
      events(instance, extremeModeExitHandler)
    }
  }

  function extremeModeExitHandler () {
    instance.stream.flushSync()
  }

  if (base !== null) {
    if (name !== undefined) {
      instance = instance.child(Object.assign({}, base, {name}))
    } else {
      instance = instance.child(base)
    }
  }

  return instance
}

function configure (instance, {serializers, chindings, level, levelVal}) {
  instance.serializers = serializers
  instance.chindings = chindings

  if (level && levelVal) {
    const levelIsStandard = isStandardLevel(level)
    const valIsStandard = isStandardLevelVal(levelVal)
    if (valIsStandard) throw Error('level value is already used: ' + levelVal)
    if (levelIsStandard === false && valIsStandard === false) instance.addLevel(level, levelVal)
  }
  instance._setLevel(level)
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
  configure(_child, opts)
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
