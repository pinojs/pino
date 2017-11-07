'use strict'

var format = require('quick-format-unescaped')
var util = require('util')
var levels = require('./levels')
var serializers = require('./serializers')
var isStandardLevelVal = levels.isStandardLevelVal
var isStandardLevel = levels.isStandardLevel

function noop () {}

function copy (a, b) {
  for (var k in b) { a[k] = b[k] }
  return a
}

function applyOptions (self, opts) {
  self.serializers = opts.serializers
  self.chindings = opts.chindings

  if (opts.level && opts.levelVal) {
    var levelIsStandard = isStandardLevel(opts.level)
    var valIsStandard = isStandardLevelVal(opts.levelVal)
    if (valIsStandard) throw Error('level value is already used: ' + opts.levelVal)
    if (levelIsStandard === false && valIsStandard === false) self.addLevel(opts.level, opts.levelVal)
  }
  self._setLevel(opts.level)
}

function defineLevelsProperty (onObject) {
  Object.defineProperty(onObject, 'levels', {
    value: {
      values: copy({}, levels.levels),
      labels: copy({}, levels.nums)
    },
    enumerable: true
  })
  Object.defineProperty(onObject.levels.values, 'silent', {value: Infinity})
  Object.defineProperty(onObject.levels.labels, Infinity, {value: 'silent'})
}

function streamIsBlockable (s) {
  if (s.hasOwnProperty('_handle') && s._handle.hasOwnProperty('fd') && s._handle.fd) return true
  if (s.hasOwnProperty('fd') && s.fd) return true
  return false
}

function countInterp (s, i) {
  var n = 0
  var pos = 0
  while (true) {
    pos = s.indexOf(i, pos)
    if (pos >= 0) {
      ++n
      pos += 2
    } else break
  }
  return n
}

function genLog (z) {
  return function LOG (a, b, c, d, e, f, g, h, i, j, k) {
    var l = 0
    var m = null
    var n = null
    var o
    var p
    if (typeof a === 'object' && a !== null) {
      m = a
      n = [b, c, d, e, f, g, h, i, j, k]
      l = 1

      if (m.method && m.headers && m.socket) {
        m = serializers.mapHttpRequest(m)
      } else if (typeof m.setHeader === 'function') {
        m = serializers.mapHttpResponse(m)
      }
    } else {
      n = [a, b, c, d, e, f, g, h, i, j, k]
    }
    p = n.length = arguments.length - l
    if (p > 1) {
      l = typeof a === 'string' ? countInterp(a, '%j') : 0
      if (l) {
        n.length = l + countInterp(a, '%d') + countInterp(a, '%s') + 1
        o = `${util.format.apply(null, n)}`
      } else {
        o = format(n, this.formatOpts)
      }
    } else if (p === 1) {
      o = n[0]
    }
    this.write(m, o, z)
  }
}

module.exports = {
  noop: noop,
  copy: copy,
  applyOptions: applyOptions,
  defineLevelsProperty: defineLevelsProperty,
  streamIsBlockable: streamIsBlockable,
  genLog: genLog
}
