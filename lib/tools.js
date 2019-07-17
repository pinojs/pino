'use strict'

/* eslint no-prototype-builtins: 0 */

const format = require('quick-format-unescaped')
const { mapHttpRequest, mapHttpResponse } = require('pino-std-serializers')
const SonicBoom = require('sonic-boom')
const stringifySafe = require('fast-safe-stringify')
const {
  lsCacheSym,
  chindingsSym,
  parsedChindingsSym,
  writeSym,
  serializersSym,
  formatOptsSym,
  endSym,
  stringifiersSym,
  stringifySym,
  wildcardFirstSym,
  needsMetadataGsym,
  wildcardGsym,
  redactFmtSym,
  streamSym
} = require('./symbols')

function noop () {}

function genLog (z) {
  return function LOG (o, ...n) {
    if (typeof o === 'object' && o !== null) {
      if (o.method && o.headers && o.socket) {
        o = mapHttpRequest(o)
      } else if (typeof o.setHeader === 'function') {
        o = mapHttpResponse(o)
      }
      this[writeSym](o, format(null, n, this[formatOptsSym]), z)
    } else this[writeSym](null, format(o, n, this[formatOptsSym]), z)
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
  var point = 255
  const l = str.length
  if (l > 100) {
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

function asJson (obj, num, time) {
  const stringify = this[stringifySym]
  const stringifiers = this[stringifiersSym]
  const end = this[endSym]
  const chindings = this[chindingsSym]
  const serializers = this[serializersSym]
  var data = this[lsCacheSym][num] + time

  // we need the child bindings added to the output first so instance logged
  // objects can take precedence when JSON.parse-ing the resulting log line
  data = data + chindings

  var value
  var notHasOwnProperty = obj.hasOwnProperty === undefined
  if (serializers[wildcardGsym]) {
    obj = serializers[wildcardGsym](obj)
  }
  const wildcardStringifier = stringifiers[wildcardFirstSym]
  for (var key in obj) {
    value = obj[key]
    if ((notHasOwnProperty || obj.hasOwnProperty(key)) && value !== undefined) {
      value = serializers[key] ? serializers[key](value) : value

      const stringifier = stringifiers[key] || wildcardStringifier

      switch (typeof value) {
        case 'undefined':
        case 'function':
          continue
        case 'number':
          /* eslint no-fallthrough: "off" */
          if (Number.isFinite(value) === false) {
            value = null
          }
        // this case explicity falls through to the next one
        case 'boolean':
          if (stringifier) value = stringifier(value)
          data += ',"' + key + '":' + value
          continue
        case 'string':
          value = (stringifier || asString)(value)
          break
        default:
          value = (stringifier || stringify)(value)
      }
      if (value === undefined) continue
      data += ',"' + key + '":' + value
    }
  }

  return data + end
}

function asChindings (instance, bindings) {
  if (!bindings) {
    throw Error('missing bindings for child Pino')
  }
  var key
  var value
  var data = instance[chindingsSym]
  const stringify = instance[stringifySym]
  const stringifiers = instance[stringifiersSym]
  const serializers = instance[serializersSym]
  if (serializers[wildcardGsym]) {
    bindings = serializers[wildcardGsym](bindings)
  }
  for (key in bindings) {
    value = bindings[key]
    const valid = key !== 'level' &&
      key !== 'serializers' &&
      key !== 'customLevels' &&
      bindings.hasOwnProperty(key) &&
      value !== undefined
    if (valid === true) {
      value = serializers[key] ? serializers[key](value) : value
      value = (stringifiers[key] || stringify)(value)
      if (value === undefined) continue
      data += ',"' + key + '":' + value
    }
  }
  return data
}

function getPrettyStream (opts, prettifier, dest) {
  if (prettifier && typeof prettifier === 'function') {
    return prettifierMetaWrapper(prettifier(opts), dest)
  }
  try {
    var prettyFactory = require('pino-pretty')
    prettyFactory.asMetaWrapper = prettifierMetaWrapper
    return prettifierMetaWrapper(prettyFactory(opts), dest)
  } catch (e) {
    throw Error('Missing `pino-pretty` module: `pino-pretty` must be installed separately')
  }
}

function prettifierMetaWrapper (pretty, dest) {
  var warned = false
  return {
    [needsMetadataGsym]: true,
    lastLevel: 0,
    lastMsg: null,
    lastObj: null,
    lastLogger: null,
    flushSync () {
      if (warned) {
        return
      }
      warned = true
      dest.write(pretty(Object.assign({
        level: 40, // warn
        msg: 'pino.final with prettyPrint does not support flushing',
        time: Date.now()
      }, this.chindings())))
    },
    chindings () {
      const lastLogger = this.lastLogger
      var chindings = null

      // protection against flushSync being called before logging
      // anything
      if (!lastLogger) {
        return null
      }

      if (lastLogger.hasOwnProperty(parsedChindingsSym)) {
        chindings = lastLogger[parsedChindingsSym]
      } else {
        chindings = JSON.parse('{"v":1' + lastLogger[chindingsSym] + '}')
        lastLogger[parsedChindingsSym] = chindings
      }

      return chindings
    },
    write (chunk) {
      const lastLogger = this.lastLogger
      const chindings = this.chindings()

      var time = this.lastTime

      if (time.match(/^\d+/)) {
        time = parseInt(time)
      }

      var lastObj = this.lastObj
      var errorProps = null

      const obj = Object.assign({
        level: this.lastLevel,
        time
      }, chindings, lastObj, errorProps)

      const serializers = lastLogger[serializersSym]
      const keys = Object.keys(serializers)
      var key

      for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        if (obj[key] !== undefined) {
          obj[key] = serializers[key](obj[key])
        }
      }

      const stringifiers = lastLogger[stringifiersSym]
      const redact = stringifiers[redactFmtSym]

      const formatted = pretty(typeof redact === 'function' ? redact(obj) : obj)
      if (formatted === undefined) return
      dest.write(formatted)
    }
  }
}

function hasBeenTampered (stream) {
  return stream.write !== stream.constructor.prototype.write
}

function buildSafeSonicBoom (dest, buffer = 0, sync = true) {
  const stream = new SonicBoom(dest, buffer, sync)
  stream.on('error', filterBrokenPipe)
  return stream

  function filterBrokenPipe (err) {
    // TODO verify on Windows
    if (err.code === 'EPIPE') {
      // If we get EPIPE, we should stop logging here
      // however we have no control to the consumer of
      // SonicBoom, so we just overwrite the write method
      stream.write = noop
      stream.end = noop
      stream.flushSync = noop
      stream.destroy = noop
      return
    }
    stream.removeListener('error', filterBrokenPipe)
    stream.emit('error', err)
  }
}

function createArgsNormalizer (defaultOptions) {
  return function normalizeArgs (opts = {}, stream) {
    // support stream as a string
    if (typeof opts === 'string') {
      stream = buildSafeSonicBoom(opts)
      opts = {}
    } else if (typeof stream === 'string') {
      stream = buildSafeSonicBoom(stream)
    } else if (opts instanceof SonicBoom || opts.writable || opts._writableState) {
      stream = opts
      opts = null
    }
    opts = Object.assign({}, defaultOptions, opts)
    if ('extreme' in opts) {
      throw Error('The extreme option has been removed, use pino.extreme instead')
    }
    if ('onTerminated' in opts) {
      throw Error('The onTerminated option has been removed, use pino.final instead')
    }
    const { enabled, prettyPrint, prettifier, messageKey } = opts
    if (enabled === false) opts.level = 'silent'
    stream = stream || process.stdout
    if (stream === process.stdout && stream.fd >= 0 && !hasBeenTampered(stream)) {
      stream = buildSafeSonicBoom(stream.fd)
    }
    if (prettyPrint) {
      const prettyOpts = Object.assign({ messageKey }, prettyPrint)
      stream = getPrettyStream(prettyOpts, prettifier, stream)
    }
    return { opts, stream }
  }
}

function final (logger, handler) {
  if (typeof logger === 'undefined' || typeof logger.child !== 'function') {
    throw Error('expected a pino logger instance')
  }
  const hasHandler = (typeof handler !== 'undefined')
  if (hasHandler && typeof handler !== 'function') {
    throw Error('if supplied, the handler parameter should be a function')
  }
  const stream = logger[streamSym]
  if (typeof stream.flushSync !== 'function') {
    throw Error('final requires a stream that has a flushSync method, such as pino.destination and pino.extreme')
  }

  const finalLogger = new Proxy(logger, {
    get: (logger, key) => {
      if (key in logger.levels.values) {
        return (...args) => {
          logger[key](...args)
          stream.flushSync()
        }
      }
      return logger[key]
    }
  })

  if (!hasHandler) {
    return finalLogger
  }

  return (err = null, ...args) => {
    try {
      stream.flushSync()
    } catch (e) {
      // it's too late to wait for the stream to be ready
      // because this is a final tick scenario.
      // in practice there shouldn't be a situation where it isn't
      // however, swallow the error just in case (and for easier testing)
    }
    return handler(err, finalLogger, ...args)
  }
}

function stringify (obj) {
  try {
    return JSON.stringify(obj)
  } catch (_) {
    return stringifySafe(obj)
  }
}

module.exports = {
  noop,
  buildSafeSonicBoom,
  getPrettyStream,
  asChindings,
  asJson,
  genLog,
  createArgsNormalizer,
  final,
  stringify
}
