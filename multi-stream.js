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
  }
  MSPino.prototype = Object.create(realPino.Pino.prototype)
  MSPino.constructor = MSPino

  function doLog (logger, level, params) {
    logger[level].apply(logger, params)
  }
  MSPino.prototype._issueLog = function issueLog (level, params) {
    if (!this.loggers[level]) return noop()
    for (var i = 0, j = this.loggers[level].length; i < j; i += 1) {
      doLog(this.loggers[level][i], level, params)
    }
  }

  MSPino.prototype.fatal = function fatal () {
    this._issueLog('fatal', arguments)
  }
  MSPino.prototype.error = function error () {
    this._issueLog('error', arguments)
  }
  MSPino.prototype.warn = function warn () {
    this._issueLog('warn', arguments)
  }
  MSPino.prototype.info = function info () {
    this._issueLog('info', arguments)
  }
  MSPino.prototype.debug = function debug () {
    this._issueLog('debug', arguments)
  }
  MSPino.prototype.trace = function trace () {
    this._issueLog('trace', arguments)
  }
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
