'use strict'

const os = require('os')
const { EventEmitter } = require('events')
const stringifySafe = require('fast-safe-stringify')
const serializers = require('pino-std-serializers')
const flatstr = require('flatstr')
const SonicBoom = require('sonic-boom')
const events = require('./lib/events')
const redaction = require('./lib/redaction')
const timeFmt = require('./lib/time')
const {
  lsCacheSym,
  getLevelValSym,
  setLevelValSym,
  setLevelSym,
  getLevelSym,
  chindingsSym,
  needsMetadataGsym
} = require('./lib/symbols')
const {
  isStandardLevelVal,
  isStandardLevel,
  lsCache,
  setLevelVal,
  getLevelVal,
  getLevel,
  setLevel,
  addLevel,
  mappings,
  isLevelEnabled
} = require('./lib/levels')
const {
  copy,
  noop,
  getPrettyStream,
  asChindings,
  asJson
} = require('./lib/tools')
const { version } = require('./package.json')
const { epochTime, nullTime } = timeFmt
const LOG_VERSION = 1

const defaultOptions = {
  safe: true,
  name: undefined,
  serializers: {},
  redact: null,
  timestamp: epochTime,
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

const prototype = {
  asJson,
  child,
  write,
  flush,
  addLevel,
  isLevelEnabled,
  silent: noop,
  stream: process.stdout,
  pino: version,
  get levelVal () { return this[getLevelValSym]() },
  set levelVal (num) { return this[setLevelValSym](num) },
  get level () { return this[getLevelSym]() },
  set level (lvl) { return this[setLevelSym](lvl) },
  [lsCacheSym]: copy({}, lsCache),
  [getLevelValSym]: getLevelVal,
  [setLevelValSym]: setLevelVal,
  [getLevelSym]: getLevel,
  [setLevelSym]: setLevel,
  LOG_VERSION
}

Object.setPrototypeOf(prototype, EventEmitter.prototype)

module.exports = pino

pino.extreme = (dest = process.stdout.fd) => new SonicBoom(dest, 4096)
pino.destination = (dest = process.stdout.fd) => new SonicBoom(dest)
pino.levels = mappings()
pino.stdSerializers = Object.assign({}, serializers)
pino.stdTimeFunctions = Object.assign({}, timeFmt)

pino.LOG_VERSION = LOG_VERSION

function pino (opts, stream) {
  const { core, state } = create(opts, stream)
  const { base, name, serializers, chindings, level, levelVal } = state

  Object.setPrototypeOf(core, prototype)
  events(core)
  configure(core, {serializers, chindings, level, levelVal})

  const logger = base === null
    ? core
    : name === undefined
      ? core.child(base)
      : core.child(Object.assign({}, base, {name}))

  return logger
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

function configure (instance, {serializers, chindings, level, levelVal}) {
  instance.serializers = serializers
  instance[chindingsSym] = chindings

  if (level && levelVal) {
    const levelIsStandard = isStandardLevel(level)
    const valIsStandard = isStandardLevelVal(levelVal)
    if (valIsStandard) throw Error('level value is already used: ' + levelVal)
    if (levelIsStandard === false && valIsStandard === false) instance.addLevel(level, levelVal)
  }
  instance[setLevelSym](level)
}

function write (obj, msg, num) {
  const t = this.time()
  const s = this.asJson(obj, msg, num, t)
  const { stream } = this
  if (stream[needsMetadataGsym]) {
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

function create (opts, stream) {
  if (opts && (opts.writable || opts._writableState || opts instanceof SonicBoom)) {
    stream = opts
    opts = defaultOptions
  }
  opts = Object.assign({}, defaultOptions, opts)

  if (opts.enabled === false) opts.level = 'silent'

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
  } = opts

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
  const time = (timestamp && timestamp instanceof Function)
    ? timestamp
    : (timestamp ? epochTime : nullTime)
  const levels = mappings()
  const core = {
    levels,
    time,
    stream,
    stringify,
    stringifiers,
    end,
    timestamp,
    formatOpts,
    onTerminated,
    messageKey,
    messageKeyString
  }
  const state = {
    base,
    name,
    serializers,
    chindings,
    level,
    levelVal
  }

  return {core, state}
}
