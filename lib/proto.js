'use strict'
const { EventEmitter } = require('events')
const SonicBoom = require('sonic-boom')
const flatstr = require('flatstr')
const {
  lsCacheSym,
  getLevelValSym,
  setLevelValSym,
  setLevelSym,
  getLevelSym,
  chindingsSym,
  asJsonSym,
  writeSym,
  timeSym,
  streamSym,
  serializersSym,
  needsMetadataGsym
} = require('./symbols')
const {
  lsCache,
  setLevelVal,
  getLevelVal,
  getLevel,
  setLevel,
  addLevel,
  setLevelState,
  isLevelEnabled,
  isStandardLevelVal
} = require('./levels')
const {
  noop,
  asChindings,
  asJson
} = require('./tools')
const {
  version,
  LOG_VERSION
} = require('./meta')

// note: use of class is satirical
const constructor = class Pino {}
const prototype = {
  constructor,
  child,
  flush,
  addLevel,
  isLevelEnabled,
  silent: noop,
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

module.exports = prototype

function child (bindings) {
  const { level, levelVal } = this
  const serializers = this[serializersSym]
  const chindings = asChindings(this, bindings)
  const instance = Object.create(this)
  if (bindings.hasOwnProperty('serializers') === true) {
    instance[serializersSym] = {}
    for (var k in serializers) {
      instance[serializersSym][k] = serializers[k]
    }
    for (var bk in bindings.serializers) {
      instance[serializersSym][bk] = bindings.serializers[bk]
    }
  } else instance[serializersSym] = serializers
  instance[chindingsSym] = chindings
  const childLevel = bindings.level || level
  if (isStandardLevelVal(levelVal) === true) instance[setLevelSym](childLevel)
  else setLevelState(instance, childLevel, levelVal)
  return instance
}

function write (obj, msg, num) {
  const t = this[timeSym]()
  const s = this[asJsonSym](obj, msg, num, t)
  const stream = this[streamSym]
  if (stream[needsMetadataGsym] === true) {
    stream.lastLevel = num
    stream.lastMsg = msg
    stream.lastObj = obj
    stream.lastTime = t.slice(8)
    stream.lastLogger = this // for child loggers
  }
  if (stream instanceof SonicBoom) stream.write(s)
  else stream.write(flatstr(s))
}

function flush () {
  const stream = this[streamSym]
  if ('flushSync' in stream) stream.flushSync()
}
