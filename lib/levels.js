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
module.exports.levels = levels

var nums = Object.keys(levels).reduce(function (o, k) {
  o[levels[k]] = k
  return o
}, {})
module.exports.nums = nums

// level string cache
var lscache = Object.keys(nums).reduce(function (o, k) {
  o[k] = flatstr('"level":' + Number(k))
  return o
}, {})
module.exports.lscache = lscache

// IIFE so the keys are cached at module load
var isStandardLevel = (function () {
  var keys = Object.keys(levels)
  return function (level) {
    if (Infinity === level) {
      return true
    }
    return keys.indexOf(level) > -1
  }
}())
module.exports.isStandardLevel = isStandardLevel

var isStandardLevelVal = (function () {
  var keys = Object.keys(nums)
  return function (val) {
    if (!isFinite(val)) {
      return true
    }
    return keys.indexOf(val + '') > -1
  }
}())
module.exports.isStandardLevelVal = isStandardLevelVal
