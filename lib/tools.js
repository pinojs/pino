'use strict'

const format = require('quick-format-unescaped')
const util = require('util')
const serializers = require('pino-std-serializers')
const {
  lsCacheSym,
  chindingsSym,
  parsedChindingsSym,
  needsMetadataGsym,
  wildcardGsym
} = require('./symbols')

function noop () {}

function copy (a, b) {
  for (var k in b) { a[k] = b[k] }
  return a
}

function asMetaWrapper (pretty, dest) {
  if (!dest) {
    dest = process.stdout
  } else if (!dest.write) {
    throw new Error('the destination must be writable')
  }

  return {
    [needsMetadataGsym]: true,
    lastLevel: 0,
    lastMsg: null,
    lastObj: null,
    lastLogger: null,
    write (chunk) {
      var chindings = this.lastLogger[parsedChindingsSym]

      if (!chindings) {
        chindings = JSON.parse('{"v":1' + this.lastLogger[chindingsSym] + '}')
        this.lastLogger[parsedChindingsSym] = chindings
      }

      const obj = Object.assign({
        level: this.lastLevel,
        msg: this.lastMsg,
        time: this.lastTime
      }, chindings, this.lastObj)

      const formatted = pretty(obj)
      if (formatted === undefined) return
      dest.write(formatted)
    }
  }
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

function getPrettyStream (opts, prettifier, dest) {
  if (prettifier && typeof prettifier === 'function') {
    return asMetaWrapper(prettifier(opts), dest)
  }
  try {
    var prettyFactory = require('pino-pretty')
    return asMetaWrapper(prettyFactory(opts), dest)
  } catch (e) {
    throw Error('Missing `pino-pretty` module: `pino-pretty` must be installed separately')
  }
}

// magically escape strings for json
// relying on their charCodeAt
// everything below 32 needs JSON.stringify()
// 34 and 92 happens all the time, so we
// have a fast case for them
function asString (str) {
  var result = ''
  var last = 0
  var found = false
  var l = str.length
  var point = 255
  if (l > 42) {
    return JSON.stringify(str)
  }
  for (var i = 0; i < l && point >= 32; i++) {
    point = str.charCodeAt(i)
    if (point === 34 || point === 92) {
      result += str.slice(last, i) + '\\'
      last = i
      found = true
    }
  }
  if (!found) {
    result = str
  } else {
    result += str.slice(last)
  }
  return point < 32 ? JSON.stringify(str) : '"' + result + '"'
}

function asJson (obj, msg, num, time) {
  // to catch both null and undefined
  var hasObj = obj !== undefined && obj !== null
  var objError = hasObj && obj instanceof Error
  msg = !msg && objError ? obj.message : msg || undefined
  var data = this[lsCacheSym][num] + time
  if (msg !== undefined) {
    data += this.messageKeyString + asString('' + msg)
  }
  // we need the child bindings added to the output first so instance logged
  // objects can take precedence when JSON.parse-ing the resulting log line
  data = data + this[chindingsSym]
  var value
  if (hasObj) {
    var notHasOwnProperty = obj.hasOwnProperty === undefined
    if (objError) {
      data += ',"type":"Error","stack":' + this.stringify(obj.stack)
    }
    // if global serializer is set, call it first
    if (this.serializers[wildcardGsym]) {
      obj = this.serializers[wildcardGsym](obj)
    }
    for (var key in obj) {
      value = obj[key]
      if ((notHasOwnProperty || obj.hasOwnProperty(key)) && value !== undefined) {
        value = (this.stringifiers[key] || this.stringify)(this.serializers[key] ? this.serializers[key](value) : value)
        if (value !== undefined) {
          data += ',"' + key + '":' + value
        }
      }
    }
  }
  return data + this.end
}

function asChindings (instance, bindings) {
  if (!bindings) {
    throw Error('missing bindings for child Pino')
  }
  var key
  var value
  var data = instance[chindingsSym]
  if (instance.serializers[wildcardGsym]) {
    bindings = instance.serializers[wildcardGsym](bindings)
  }
  for (key in bindings) {
    value = bindings[key]
    if (key !== 'level' && key !== 'serializers' && bindings.hasOwnProperty(key) && value !== undefined) {
      value = instance.serializers[key] ? instance.serializers[key](value) : value
      data += ',"' + key + '":' + (instance.stringifiers[key] || instance.stringify)(value)
    }
  }
  return data
}

module.exports = {
  copy,
  noop,
  getPrettyStream,
  asChindings,
  asJson,
  genLog
}
