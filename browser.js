'use strict'

var format = require('quick-format-unescaped')

module.exports = pino

var _console = global.console || {}
var stdSerializers = {
  req: mock,
  res: mock,
  err: asErrValue
}

function pino (opts) {
  opts = opts || {}
  opts.browser = opts.browser || {}
  var proto = opts.browser.write || _console
  if (opts.browser.write) opts.browser.asObject = true
  var serializers = opts.serializers || {}
  var serialize = Array.isArray(opts.browser.serialize)
    ? opts.browser.serialize.filter(function (k) {
      return k !== '!stdSerializers.err'
    })
    : opts.browser.serialize === true ? Object.keys(serializers) : false
  var stdErrSerialize = opts.browser.serialize

  if (
    Array.isArray(opts.browser.serialize) &&
    opts.browser.serialize.indexOf('!stdSerializers.err') > -1
  ) stdErrSerialize = false

  var levels = ['error', 'fatal', 'warn', 'info', 'debug', 'trace']

  if (typeof proto === 'function') {
    proto.error = proto.fatal = proto.warn =
    proto.info = proto.debug = proto.trace = proto
  }
  if (opts.enabled === false) opts.level = 'silent'
  var level = opts.level || 'info'
  var val = pino.levels.values[level]
  if (level === 'silent') val = Infinity
  var logger = Object.create(proto)
  if (!logger.log) logger.log = noop

  set(logger, val, 'error', 'log') // <-- must stay first
  set(logger, val, 'fatal', 'error')
  set(logger, val, 'warn', 'error')
  set(logger, val, 'info', 'log')
  set(logger, val, 'debug', 'log')
  set(logger, val, 'trace', 'log')

  logger.setMaxListeners = logger.getMaxListeners =
  logger.emit = logger.addListener = logger.on =
  logger.prependListener = logger.once =
  logger.prependOnceListener = logger.removeListener =
  logger.removeAllListeners = logger.listeners =
  logger.listenerCount = logger.eventNames =
  logger.write = logger.flush = noop
  logger.serializers = serializers
  logger._serialize = serialize
  logger._stdErrSerialize = stdErrSerialize
  logger.child = child

  function child (bindings) {
    if (!bindings) {
      throw new Error('missing bindings for child Pino')
    }
    if (serialize && bindings.serializers) {
      var childSerializers = Object.assign({}, serializers, bindings.serializers)
      var childSerialize = opts.browser.serialize === true
        ? Object.keys(childSerializers)
        : serialize
      delete bindings.serializers
      applySerializers([bindings], childSerialize, childSerializers, this._stdErrSerialize)
    }
    function Child (parent) {
      this._childLevel = (parent._childLevel | 0) + 1
      this.error = bind(parent, bindings, 'error')
      this.fatal = bind(parent, bindings, 'fatal')
      this.warn = bind(parent, bindings, 'warn')
      this.info = bind(parent, bindings, 'info')
      this.debug = bind(parent, bindings, 'debug')
      this.trace = bind(parent, bindings, 'trace')
      if (childSerializers) {
        this.serializers = childSerializers
        this._serialize = childSerialize
      }
    }
    Child.prototype = this
    return new Child(this)
  }
  logger.levels = pino.levels
  if (serialize && !opts.browser.asObject) serializerWrap(logger, levels)
  return !opts.browser.asObject ? logger : asObject(logger, levels)
}

function serializerWrap (logger, levels) {
  var k
  for (var i = 0; i < levels.length; i++) {
    k = levels[i]
    logger[k] = (function (write) {
      return function LOG () {
        var args = new Array(arguments.length)
        for (var i = 0; i < args.length; i++) args[i] = arguments[i]
        applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize)
        write.apply(this, args)
      }
    })(logger[k])
  }
}

function applySerializers (args, serialize, serializers, stdErrSerialize) {
  for (var i in args) {
    if (stdErrSerialize && args[i] instanceof Error) {
      args[i] = pino.stdSerializers.err(args[i])
    } else if (typeof args[i] === 'object' && !Array.isArray(args[i])) {
      for (var k in args[i]) {
        if (serialize.indexOf(k) > -1 && k in serializers) {
          args[i][k] = serializers[k](args[i][k])
        }
      }
    }
  }
}

function asObject (logger, levels) {
  var k
  for (var i = 0; i < levels.length; i++) {
    k = levels[i]
    logger[k] = (function (write, k) {
      return function LOG () {
        var args = new Array(arguments.length)
        for (var i = 0; i < args.length; i++) args[i] = arguments[i]
        if (this._serialize) applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize)
        var msg = args[0]
        var o = { time: Date.now(), level: pino.levels.values[k] }
        var lvl = (this._childLevel | 0) + 1
        if (lvl < 1) lvl = 1
        // deliberate, catching objects, arrays
        if (msg !== null && typeof msg === 'object') {
          while (lvl-- && typeof args[0] === 'object') {
            Object.assign(o, args.shift())
          }
          msg = args.length ? format(args) : undefined
        } else if (typeof msg === 'string') msg = format(args)
        if (msg !== undefined) o.msg = msg
        write.call(this, o)
      }
    })(logger[k], k)
  }
  return logger
}

pino.LOG_VERSION = 1

pino.levels = {
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  },
  labels: {
    '10': 'trace',
    '20': 'debug',
    '30': 'info',
    '40': 'warn',
    '50': 'error',
    '60': 'fatal'
  }
}

pino.stdSerializers = stdSerializers

function bind (parent, bindings, level) {
  return function () {
    var args = new Array(1 + arguments.length)
    args[0] = bindings
    for (var i = 1; i < args.length; i++) {
      args[i] = arguments[i - 1]
    }
    return parent[level].apply(this, args)
  }
}

function set (logger, val, level, fallback) {
  logger[level] = val > pino.levels.values[level] ? noop
    : (logger[level] ? logger[level] : (_console[level] || _console[fallback] || noop))
}

function asErrValue (err) {
  var obj = {
    type: err.constructor.name,
    msg: err.message,
    stack: err.stack
  }
  for (var key in err) {
    if (obj[key] === undefined) {
      obj[key] = err[key]
    }
  }
  return obj
}

function mock () { return {} }
function noop () {}
