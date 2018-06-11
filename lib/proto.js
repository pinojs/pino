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

module.exports = prototype

function child (bindings) {
  const { level, levelVal, serializers } = this
  const chindings = asChindings(this, bindings)
  const instance = Object.create(this)
  if (bindings.hasOwnProperty('serializers') === true) {
    instance.serializers = {}
    for (var k in serializers) {
      instance.serializers[k] = serializers[k]
    }
    for (var bk in bindings.serializers) {
      instance.serializers[bk] = bindings.serializers[bk]
    }
  } else instance.serializers = serializers
  instance[chindingsSym] = chindings
  if (isStandardLevelVal(levelVal) === true) {
    instance[setLevelSym](bindings.level || level)
  } else setLevelState(instance, bindings.level || level, levelVal)
  return instance
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
  if (stream instanceof SonicBoom) stream.write(s)
  else stream.write(flatstr(s))
}

function flush () {
  if (!this.stream.flushSync) return
  this.stream.flushSync()
}
