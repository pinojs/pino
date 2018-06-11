'use strict'
const os = require('os')
const stringifySafe = require('fast-safe-stringify')
const serializers = require('pino-std-serializers')
const SonicBoom = require('sonic-boom')
const events = require('./lib/events')
const redaction = require('./lib/redaction')
const timeFmt = require('./lib/time')
const proto = require('./lib/proto')
const { chindingsSym } = require('./lib/symbols')
const { setLevelState, mappings } = require('./lib/levels')
const { createArgsNormalizer } = require('./lib/tools')
const { LOG_VERSION } = require('./lib/meta')
const { epochTime, nullTime } = timeFmt

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

const normalize = createArgsNormalizer(defaultOptions)

function pino (...args) {
  const { opts, stream } = normalize(...args)
  const {
    safe,
    redact,
    crlf,
    serializers,
    timestamp,
    onTerminated,
    messageKey,
    base,
    name,
    level,
    levelVal
  } = opts

  const stringify = safe ? stringifySafe : JSON.stringify
  const stringifiers = redact ? redaction(redact, stringify) : {}
  const formatOpts = redact
    ? {stringify: stringifiers[redaction.format]}
    : { stringify }
  const messageKeyString = `,"${messageKey}":`
  const end = ',"v":' + LOG_VERSION + '}' + (crlf ? '\r\n' : '\n')
  const chindings = ''
  const time = (timestamp && timestamp instanceof Function)
    ? timestamp : (timestamp ? epochTime : nullTime)
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
  Object.setPrototypeOf(core, proto)

  events(core)
  setLevelState(core, level, levelVal)

  const instance = base === null
    ? core
    : name === undefined
      ? core.child(base)
      : core.child(Object.assign({}, base, { name }))

  return instance
}

pino.extreme = (dest = process.stdout.fd) => new SonicBoom(dest, 4096)
pino.destination = (dest = process.stdout.fd) => new SonicBoom(dest)
pino.levels = mappings()
pino.stdSerializers = Object.assign({}, serializers)
pino.stdTimeFunctions = Object.assign({}, timeFmt)

pino.LOG_VERSION = LOG_VERSION

module.exports = pino
