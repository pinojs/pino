'use strict'
const { EventEmitter } = require('events')
const SonicBoom = require('sonic-boom')
const flatstr = require('flatstr')
const {
  lsCacheSym,
  levelValSym,
  setLevelSym,
  getLevelSym,
  chindingsSym,
  asJsonSym,
  messageKeySym,
  writeSym,
  timeSym,
  streamSym,
  serializersSym,
  useOnlyCustomLevelsSym,
  needsMetadataGsym
} = require('./symbols')
const {
  getLevel,
  setLevel,
  isLevelEnabled,
  mappings,
  initialLsCache,
  genLsCache,
  assertNoLevelCollisions
} = require('./levels')
const {
  asChindings,
  asJson
} = require('./tools')
const {
  version,
  LOG_VERSION
} = require('./meta')

// note: use of class is satirical
// https://github.com/pinojs/pino/pull/433#pullrequestreview-127703127
const constructor = class Pino {}
const prototype = {
  constructor,
  child,
  bindings,
  flush,
  isLevelEnabled,
  version,
  get level () { return this[getLevelSym]() },
  set level (lvl) { return this[setLevelSym](lvl) },
  get levelVal () { return this[levelValSym] },
  set levelVal (n) { throw Error('levelVal is read-only') },
  [lsCacheSym]: initialLsCache,
  [writeSym]: write,
  [asJsonSym]: asJson,
  [getLevelSym]: getLevel,
  [setLevelSym]: setLevel,
  LOG_VERSION
}

Object.setPrototypeOf(prototype, EventEmitter.prototype)

module.exports = prototype

function child (bindings) {
  const { level } = this
  const serializers = this[serializersSym]
  const chindings = asChindings(this, bindings)
  const instance = Object.create(this)
  if (bindings.hasOwnProperty('serializers') === true) {
    instance[serializersSym] = Object.create(null)
    for (var k in serializers) {
      instance[serializersSym][k] = serializers[k]
    }
    for (var bk in bindings.serializers) {
      instance[serializersSym][bk] = bindings.serializers[bk]
    }
  } else instance[serializersSym] = serializers
  if (bindings.hasOwnProperty('customLevels') === true) {
    assertNoLevelCollisions(this.levels, bindings.customLevels)
    instance.levels = mappings(bindings.customLevels, instance[useOnlyCustomLevelsSym])
    genLsCache(instance)
  }
  instance[chindingsSym] = chindings
  const childLevel = bindings.level || level
  instance[setLevelSym](childLevel)

  return instance
}

function bindings () {
  const chindings = this[chindingsSym]
  var chindingsJson = `{${chindings.substr(1)}}` // at least contains ,"pid":7068,"hostname":"myMac"
  var bindingsFromJson = JSON.parse(chindingsJson)
  delete bindingsFromJson['pid']
  delete bindingsFromJson['hostname']
  return bindingsFromJson
}

function write (_obj, msg, num) {
  const t = this[timeSym]()
  const messageKey = this[messageKeySym]
  const objError = _obj instanceof Error
  var obj

  if (_obj === undefined || _obj === null) {
    obj = {}
    obj[messageKey] = msg
  } else {
    obj = Object.assign({}, _obj)
    if (msg) {
      obj[messageKey] = msg
    } else if (objError) {
      obj[messageKey] = _obj.message
    }

    if (objError) {
      obj.stack = _obj.stack
      if (!obj.type) {
        obj.type = 'Error'
      }
    }
  }

  const s = this[asJsonSym](obj, num, t, objError)

  const stream = this[streamSym]
  if (stream[needsMetadataGsym] === true) {
    stream.lastLevel = num
    // TODO remove in the next major release,
    // it is not needed anymore
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
  if ('flush' in stream) stream.flush()
}
