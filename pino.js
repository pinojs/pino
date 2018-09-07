'use strict'
const os = require('os')
const serializers = require('pino-std-serializers')
const SonicBoom = require('sonic-boom')
const redaction = require('./lib/redaction')
const time = require('./lib/time')
const proto = require('./lib/proto')
const symbols = require('./lib/symbols')
const { assertDefaultLevelFound, mappings, genLsCache } = require('./lib/levels')
const {
  createArgsNormalizer,
  asChindings,
  final,
  stringify
} = require('./lib/tools')
const { version, LOG_VERSION } = require('./lib/meta')
const {
  chindingsSym,
  redactFmtSym,
  serializersSym,
  timeSym,
  streamSym,
  stringifySym,
  stringifiersSym,
  setLevelSym,
  endSym,
  formatOptsSym,
  messageKeyStringSym,
  useLevelLabelsSym,
  changeLevelNameSym,
  useOnlyCustomLevelsSym
} = symbols
const { epochTime, nullTime } = time
const { pid } = process
const hostname = os.hostname()
const defaultErrorSerializer = serializers.err
const defaultOptions = {
  level: 'info',
  useLevelLabels: false,
  messageKey: 'msg',
  enabled: true,
  prettyPrint: false,
  base: { pid, hostname },
  serializers: { err: defaultErrorSerializer },
  timestamp: epochTime,
  name: undefined,
  redact: null,
  customLevels: null,
  changeLevelName: 'level',
  useOnlyCustomLevels: false
}

const normalize = createArgsNormalizer(defaultOptions)

function pino (...args) {
  const { opts, stream } = normalize(...args)
  const {
    redact,
    crlf,
    serializers,
    timestamp,
    messageKey,
    base,
    name,
    level,
    customLevels,
    useLevelLabels,
    changeLevelName,
    useOnlyCustomLevels
  } = opts

  const stringifiers = redact ? redaction(redact, stringify) : {}
  const formatOpts = redact
    ? { stringify: stringifiers[redactFmtSym] }
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

  if (useOnlyCustomLevels && !customLevels) throw Error('customLevels is required if useOnlyCustomLevels is set true')

  assertDefaultLevelFound(level, customLevels, useOnlyCustomLevels)
  const levels = mappings(customLevels, useOnlyCustomLevels)

  const instance = {
    levels,
    [useLevelLabelsSym]: useLevelLabels,
    [changeLevelNameSym]: changeLevelName,
    [useOnlyCustomLevelsSym]: useOnlyCustomLevels,
    [streamSym]: stream,
    [timeSym]: time,
    [stringifySym]: stringify,
    [stringifiersSym]: stringifiers,
    [endSym]: end,
    [formatOptsSym]: formatOpts,
    [messageKeyStringSym]: messageKeyString,
    [serializersSym]: serializers,
    [chindingsSym]: chindings
  }
  Object.setPrototypeOf(instance, proto)

  if (customLevels || useLevelLabels || changeLevelName !== defaultOptions.changeLevelName) genLsCache(instance)

  instance[setLevelSym](level)

  return instance
}

pino.extreme = (dest = process.stdout.fd) => new SonicBoom(dest, 4096)
pino.destination = (dest = process.stdout.fd) => new SonicBoom(dest)
pino.final = final
pino.levels = mappings()
pino.stdSerializers = Object.assign({}, serializers)
pino.stdTimeFunctions = Object.assign({}, time)
pino.symbols = symbols
pino.version = version
pino.LOG_VERSION = LOG_VERSION

module.exports = pino
