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

const nums = Object.keys(levels).reduce(function (o, k) {
  o[levels[k]] = k
  return o
}, {})

// level string cache
const lsCache = Object.keys(nums).reduce(function (o, k) {
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
  if (typeof num === 'string') { return this[setLevelSym](num) }

  if (this.emit) {
    this.emit('level-change', this.levels.labels[num], num, this.levels.labels[this[levelValSym]], this[levelValSym])
  }

  this[levelValSym] = num

  for (var key in this.levels.values) {
    if (num > this.levels.values[key]) {
      this[key] = noop
      continue
    }
    this[key] = isStandardLevel(key) ? levelMethods[key] : genLog(this.levels.values[key])
  }
}
function setLevel (level) {
  if (typeof level === 'number') {
    if (!isFinite(level)) {
      throw Error('unknown level ' + level)
    }
    level = this.levels.labels[level]
  }
  if (!this.levels.values[level]) {
    throw Error('unknown level ' + level)
  }
  this.levelVal = this.levels.values[level]
}

function getLevel (level) {
  return this.levels.labels[this.levelVal]
}

function addLevel (name, lvl) {
  if (this.levels.values.hasOwnProperty(name)) return false
  if (this.levels.labels.hasOwnProperty(lvl)) return false
  this.levels.values[name] = lvl
  this.levels.labels[lvl] = name
  this[lsCacheSym][lvl] = flatstr('{"level":' + Number(lvl))
  this[name] = lvl < this[levelValSym] ? noop : genLog(lvl)
  return true
}

function isLevelEnabled (logLevel) {
  const logLevelVal = this.levels.values[logLevel]
  return logLevelVal && (logLevelVal >= this[levelValSym])
}

module.exports = {
  isStandardLevelVal,
  isStandardLevel,
  lsCache,
  levels,
  nums,
  levelMethods,
  getLevelVal,
  setLevelVal,
  getLevel,
  setLevel,
  addLevel,
  isLevelEnabled
}
