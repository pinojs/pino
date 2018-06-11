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
  asJsonSym,
  writeSym,
  needsMetadataGsym
} = require('./lib/symbols')
const {
  lsCache,
  setLevelVal,
  getLevelVal,
  getLevel,
  setLevel,
  addLevel,
  setLevelState,
  mappings,
  isLevelEnabled,
  isStandardLevelVal
} = require('./lib/levels')
const {
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
  child,
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
  [writeSym]: write,
  [asJsonSym]: asJson,
  [lsCacheSym]: Object.assign({}, lsCache),
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
  const { base, name, level, levelVal } = state

  Object.setPrototypeOf(core, prototype)
  events(core)
  setLevelState(core, level, levelVal)

  const logger = base === null
    ? core
    : name === undefined
      ? core.child(base)
      : core.child(Object.assign({}, base, {name}))

  return logger
}

function child (bindings) {
  const { level, levelVal, serializers } = this
  const chindings = asChindings(this, bindings)
  const logger = Object.create(this)
  if (bindings.hasOwnProperty('serializers') === true) {
    logger.serializers = {}
    for (var k in serializers) {
      logger.serializers[k] = serializers[k]
    }
    for (var bk in bindings.serializers) {
      logger.serializers[bk] = bindings.serializers[bk]
    }
  } else logger.serializers = serializers
  logger[chindingsSym] = chindings
  if (isStandardLevelVal(levelVal) === true) logger[setLevelSym](bindings.level || level)
  else setLevelState(logger, bindings.level || level, levelVal)
  return logger
}

function write (obj, msg, num) {
  const t = this.time()
  const s = this[asJsonSym](obj, msg, num, t)
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
    serializers,
    end,
    timestamp,
    formatOpts,
    onTerminated,
    messageKey,
    messageKeyString,
    [chindingsSym]: chindings
  }
  const state = {
    base,
    name,
    level,
    levelVal
  }

  return {core, state}
}
