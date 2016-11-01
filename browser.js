'use strict'

module.exports = pino

var _console = global.console || {}
function Pino () {}
Pino.prototype = _console

function pino (opts) {
  opts = opts || {}
  var level = opts.level || 'info'
  var val = pino.levels.values[level]
  var logger = new Pino()
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

  logger.child = function child (bindings) {
    if (!bindings) {
      throw new Error('missing bindings for child Pino')
    }
    function Child (parent) {
      this.error = bind(parent, bindings, 'error')
      this.fatal = bind(parent, bindings, 'fatal')
      this.warn = bind(parent, bindings, 'warn')
      this.info = bind(parent, bindings, 'info')
      this.debug = bind(parent, bindings, 'debug')
      this.trace = bind(parent, bindings, 'trace')
    }
    Child.prototype = this
    return new Child(this)
  }
  logger.levels = pino.levels
  return logger
}

pino._Pino = Pino
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

pino.stdSerializers = {
  req: mock,
  res: mock,
  err: mock
}

function bind (parent, bindings, level) {
  return function () {
    var args = new Array(1 + arguments.length)
    args[0] = bindings
    for (var i = 1; i < args.length; i++) {
      args[i] = arguments[i - 1]
    }
    return parent[level].apply(null, args)
  }
}

function set (logger, val, level, fallback) {
  logger[level] = val > pino.levels.values[level] ? noop
    : (logger[level] ? logger[level] : (_console[fallback] || noop))
}

function mock () { return {} }
function noop () {}
