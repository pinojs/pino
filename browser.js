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

  var transmit = opts.browser.transmit
  if (transmit && typeof transmit.send !== 'function') { throw Error('pino: transmit option must have a send function') }

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

  var setOpts = {
    transmit: transmit,
    serialize: serialize,
    asObject: opts.browser.asObject,
    levels: levels,
    level: level
  }

  set(setOpts, logger, val, 'error', 'log') // <-- must stay first
  set(setOpts, logger, val, 'fatal', 'error')
  set(setOpts, logger, val, 'warn', 'error')
  set(setOpts, logger, val, 'info', 'log')
  set(setOpts, logger, val, 'debug', 'log')
  set(setOpts, logger, val, 'trace', 'log')

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

  if (transmit) logger._logEvent = createLogEventShape()

  function child (bindings) {
    if (!bindings) {
      throw new Error('missing bindings for child Pino')
    }
    var bindingsSerializers = bindings.serializers
    if (serialize && bindingsSerializers) {
      var childSerializers = Object.assign({}, serializers, bindingsSerializers)
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
      if (transmit) this._logEvent.bindings.push(bindings)
    }
    Child.prototype = this
    return new Child(this)
  }
  logger.levels = pino.levels
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

function set (opts, logger, val, level, fallback) {
  logger[level] = val > pino.levels.values[level] ? noop
    : (logger[level] ? logger[level] : (_console[level] || _console[fallback] || noop))

  wrap(opts, logger, val, level)
}

function wrap (opts, logger, val, level) {
  if (!opts.transmit && logger[level] === noop) return

  logger[level] = (function (write) {
    return function LOG () {
      var ts = Date.now()
      var args = new Array(arguments.length)
      var proto = (Object.getPrototypeOf && Object.getPrototypeOf(this) === _console) ? _console : this
      for (var i = 0; i < args.length; i++) args[i] = arguments[i]

      if (opts.serialize && !opts.asObject) {
        applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize)
      }
      if (opts.asObject) write.call(proto, asObject(this, level, args, ts))
      else write.apply(proto, args)

      if (opts.transmit) {
        var transmitLevel = opts.transmit.level || opts.level
        var transmitValue = pino.levels.values[transmitLevel]
        var methodValue = pino.levels.values[level]
        if (methodValue < transmitValue) return
        transmit(this, {
          ts: ts,
          methodLevel: level,
          methodValue: methodValue,
          transmitLevel: transmitLevel,
          transmitValue: pino.levels.values[opts.transmit.level || opts.level],
          send: opts.transmit.send,
          val: val
        }, args)
      }
    }
  })(logger[level])
}

function asObject (logger, level, args, ts) {
  if (logger._serialize) applySerializers(args, logger._serialize, logger.serializers, logger._stdErrSerialize)
  var msg = args[0]
  var o = { time: ts, level: pino.levels.values[level] }
  var lvl = (logger._childLevel | 0) + 1
  if (lvl < 1) lvl = 1
  // deliberate, catching objects, arrays
  if (msg !== null && typeof msg === 'object') {
    args = args.slice()
    while (lvl-- && typeof args[0] === 'object') {
      Object.assign(o, args.shift())
    }
    msg = args.length ? format(args) : undefined
  } else if (typeof msg === 'string') msg = format(args)
  if (msg !== undefined) o.msg = msg
  return o
}

function applySerializers (args, serialize, serializers, stdErrSerialize) {
  for (var i in args) {
    if (stdErrSerialize && args[i] instanceof Error) {
      args[i] = pino.stdSerializers.err(args[i])
    } else if (typeof args[i] === 'object' && !Array.isArray(args[i])) {
      for (var k in args[i]) {
        if (serialize && serialize.indexOf(k) > -1 && k in serializers) {
          args[i][k] = serializers[k](args[i][k])
        }
      }
    }
  }
}

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

function transmit (logger, opts, args) {
  var send = opts.send
  var ts = opts.ts
  var methodLevel = opts.methodLevel
  var methodValue = opts.methodValue
  var val = opts.val

  applySerializers(
    args,
    logger._serialize || Object.keys(logger.serializers),
    logger.serializers,
    logger._stdErrSerialize === undefined ? true : logger._stdErrSerialize
  )
  logger._logEvent.ts = ts
  logger._logEvent.messages = args.filter(function (arg) {
      // bindings can only be objects, so reference equality check via indexOf is fine
    return logger._logEvent.bindings.indexOf(arg) === -1
  })

  logger._logEvent.level.label = methodLevel
  logger._logEvent.level.value = methodValue

  send(methodLevel, logger._logEvent, val)

  logger._logEvent = createLogEventShape()
}

function createLogEventShape () {
  return {
    ts: 0,
    messages: [],
    bindings: [],
    level: {label: '', value: 0}
  }
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
