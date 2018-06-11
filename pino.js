'use strict'
const os = require('os')
const stringifySafe = require('fast-safe-stringify')
const serializers = require('pino-std-serializers')
const SonicBoom = require('sonic-boom')
const events = require('./lib/events')
const redaction = require('./lib/redaction')
const time = require('./lib/time')
const proto = require('./lib/proto')
const { setLevelState, mappings } = require('./lib/levels')
const { createArgsNormalizer, asChindings } = require('./lib/tools')
const { LOG_VERSION } = require('./lib/meta')
const { 
  chindingsSym, 
  redactFmtSym, 
  serializersSym,
  timeSym,
  streamSym,
  stringifySym,
  stringifiersSym,
  endSym,
  timestampSym,
  formatOptsSym,
  onTerminatedSym,
  messageKeySym,
  messageKeyStringSym, 
} = require('./lib/symbols')

const { epochTime, nullTime } = time
const { pid, exit } = process
const hostname = os.hostname()

const defaultOptions = {
  level: 'info',
  messageKey: 'msg',
  safe: true,
  enabled: true,
  prettyPrint: false,
  base: { pid, hostname },
  serializers: {},
  timestamp: epochTime,
  onTerminated: (evt, err) => err ? exit(1) : exit(0),
  name: undefined,
  levelVal: undefined,
  redact: null
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
    ? {stringify: stringifiers[redactFmtSym]}
    : { stringify }
  const messageKeyString = `,"${messageKey}":`
  const end = ',"v":' + LOG_VERSION + '}' + (crlf ? '\r\n' : '\n')
  const coreChindings = asChindings.bind(null, {
    [chindingsSym]: '',
    [serializersSym]: serializers,
    [stringifiersSym]: stringifiers,
    [stringifySym]: stringify
  })
  const chindings = base === null ? '' : (name === undefined)
    ? coreChindings(base) : coreChindings(Object.assign({}, base, { name }))
  const time = (timestamp instanceof Function)
    ? timestamp : (timestamp ? epochTime : nullTime)
  const levels = mappings()
  const instance = {
    levels,
    [streamSym]: stream,
    [timeSym]: time,
    [stringifySym]: stringify,
    [stringifiersSym]: stringifiers,
    [endSym]: end,
    [formatOptsSym]: formatOpts,
    [onTerminatedSym]: onTerminated,
    [messageKeyStringSym]: messageKeyString,
    [serializersSym]: serializers,
    [chindingsSym]: chindings
  }
  Object.setPrototypeOf(instance, proto)

  events(instance)
  setLevelState(instance, level, levelVal)

  return instance
}

pino.extreme = (dest = process.stdout.fd) => new SonicBoom(dest, 4096)
pino.destination = (dest = process.stdout.fd) => new SonicBoom(dest)
pino.levels = mappings()
pino.stdSerializers = Object.assign({}, serializers)
pino.stdTimeFunctions = Object.assign({}, time)
pino.LOG_VERSION = LOG_VERSION

module.exports = pino
