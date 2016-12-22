'use strict'

var realPino = require('./pino')
var noop = require('./noop')

function pino (opts, stream) {
  if (opts && (opts.writable || opts._writableState)) {
    return realPino(null, opts)
  }

  if (opts.hasOwnProperty('stream') === true) {
    return realPino(opts, opts.stream)
  }

  if (opts.hasOwnProperty('streams') === false) {
    return realPino(opts, stream)
  }

  if (Array.isArray(opts.streams) === false) {
    return realPino(opts, opts.streams)
  }

  var streams = opts.streams
  var loggers = {}
  for (var i = 0, j = streams.length; i < j; i += 1) {
    var _opts = Object.create(opts)
    var s = streams[i]
    _opts.level = (s.level) ? s.level : 'info'
    if (loggers[_opts.level]) {
      loggers[_opts.level].push(realPino(_opts, s.stream))
    } else {
      loggers[_opts.level] = [realPino(_opts, s.stream)]
    }
  }

  function MSPino (_loggers) {
    this.loggers = _loggers
    var levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace']
    for (var i = 0, j = levels.length; i < j; i += 1) {
      if (this.loggers.hasOwnProperty(levels[i]) === false) {
        this[levels[i]] = noop
      }
    }
  }
  MSPino.prototype = Object.create(realPino._Pino.prototype)
  MSPino.constructor = MSPino

  function genLog (level) {
    return function LOG (arg1, arg2, arg3, arg4, arg5, arg6) {
      for (var i = 0, j = this.loggers[level].length; i < j; i += 1) {
        var logger = this.loggers[level][i]
        var x
        var args
        switch (arguments.length) {
          case 1:
            logger[level](arg1)
            break
          case 2:
            logger[level](arg1, arg2)
            break
          case 3:
            logger[level](arg1, arg2, arg3)
            break
          case 4:
            logger[level](arg1, arg2, arg3, arg4)
            break
          case 5:
            logger[level](arg1, arg2, arg3, arg4, arg5)
            break
          case 6:
            logger[level](arg1, arg2, arg3, arg4, arg5, arg6)
            break
          default:
            args = [arg1, arg2, arg3, arg4, arg5, arg6]
            for (x = 7; x < arguments.length; x += 1) {
              args[x - 1] = arguments[x]
            }
            logger[level].apply(logger, args)
        }
      }
    }
  }
  MSPino.prototype.fatal = genLog('fatal')
  MSPino.prototype.error = genLog('error')
  MSPino.prototype.warn = genLog('warn')
  MSPino.prototype.info = genLog('info')
  MSPino.prototype.debug = genLog('debug')
  MSPino.prototype.trace = genLog('trace')

  MSPino.prototype.child = function child (bindings) {
    var levels = Object.keys(this.loggers)
    var childLoggers = {}
    for (var i = 0, j = levels.length; i < j; i += 1) {
      childLoggers[levels[i]] = []
      for (var x = 0, y = this.loggers[levels[i]].length; x < y; x += 1) {
        var log = this.loggers[levels[i]][x]
        childLoggers[levels[i]].push(log.child(bindings))
      }
    }
    return new MSPino(childLoggers)
  }

  return new MSPino(loggers)
}

module.exports = pino
