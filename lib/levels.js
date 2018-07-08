'use strict'
const flatstr = require('flatstr')
const { setLevelSym, lsCacheSym, levelValSym } = require('./symbols')
const { noop, genLog } = require('./tools')

const levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}

const levelMethods = {
  fatal: genLog(levels.fatal),
  error: genLog(levels.error),
  warn: genLog(levels.warn),
  info: genLog(levels.info),
  debug: genLog(levels.debug),
  trace: genLog(levels.trace)
}

const nums = Object.keys(levels).reduce((o, k) => {
  o[levels[k]] = k
  return o
}, {})

// level string cache
const lsCache = Object.keys(nums).reduce((o, k) => {
  o[k] = flatstr('{"level":' + Number(k))
  return o
}, {})

function isStandardLevel (level) {
  if (level === Infinity) return true
  switch (level) {
    case 'fatal':
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
    case 'trace':
      return true
    default:
      return false
  }
}

function isStandardLevelVal (val) {
  switch (val) {
    case Infinity:
    case 60:
    case 50:
    case 40:
    case 30:
    case 20:
    case 10:
      return true
    default:
      return false
  }
}

function getLevelVal () {
  return this[levelValSym]
}

function setLevelVal (num) {
  if (typeof num !== 'number') throw Error('levelVal must be a number')

  const { labels, values } = this.levels

  this.emit(
    'level-change',
    labels[num],
    num,
    labels[this[levelValSym]],
    this[levelValSym]
  )

  this[levelValSym] = num

  for (var key in values) {
    if (num > values[key]) {
      this[key] = noop
      continue
    }
    this[key] = isStandardLevel(key) ? levelMethods[key] : genLog(values[key])
  }
}

function setLevel (level) {
  const { values } = this.levels
  if (typeof level === 'number') {
    this.levelVal = level
    return
  }
  if (values[level] === undefined) throw Error('unknown level ' + level)
  this.levelVal = values[level]
}

function getLevel (level) {
  const { levels, levelVal } = this
  return levels.labels[levelVal]
}

function addLevel (name, lvl) {
  const { values, labels } = this.levels
  if (values.hasOwnProperty(name) === true) return false
  if (labels.hasOwnProperty(lvl) === true) return false
  values[name] = lvl
  labels[lvl] = name
  this[lsCacheSym][lvl] = flatstr('{"level":' + Number(lvl))
  this[name] = lvl < this[levelValSym] ? noop : genLog(lvl)
  return true
}

function isLevelEnabled (logLevel) {
  const { values } = this.levels
  const logLevelVal = values[logLevel]
  return logLevelVal !== undefined && (logLevelVal >= this[levelValSym])
}

function mappings () {
  const labels = Object.assign(
    Object.create(Object.prototype, {Infinity: {value: 'silent'}}),
    nums
  )
  const values = Object.assign(
    Object.create(Object.prototype, {silent: {value: Infinity}}),
    levels
  )
  return { labels, values }
}

function setLevelState (instance, level, levelVal) {
  const levelIsStandard = isStandardLevel(level)
  const valIsStandard = isStandardLevelVal(levelVal)
  if (valIsStandard === true) throw Error('level value is already used: ' + levelVal)
  if (levelIsStandard === false && valIsStandard === false) instance.addLevel(level, levelVal)
  instance[setLevelSym](level)
}

module.exports = {
  setLevelState,
  isStandardLevelVal,
  lsCache,
  levelMethods,
  getLevelVal,
  setLevelVal,
  getLevel,
  setLevel,
  addLevel,
  isLevelEnabled,
  mappings
}
