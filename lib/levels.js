'use strict'

var flatstr = require('flatstr')

var levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10
}

var nums = Object.keys(levels).reduce(function (o, k) {
  o[levels[k]] = k
  return o
}, {})

// level string cache
var lscache = Object.keys(nums).reduce(function (o, k) {
  o[k] = flatstr('"level":' + Number(k))
  return o
}, {})

function isStandardLevel (level) {
  if (level === Infinity) {
    return true
  }
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

module.exports = {
  levels: levels,
  nums: nums,
  lscache: lscache,
  isStandardLevel: isStandardLevel,
  isStandardLevelVal: isStandardLevelVal
}
