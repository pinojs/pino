'use strict'

var split = require('split2')
var Parse = require('fast-json-parse')
var chalk = require('chalk')

var levels = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
}

var standardKeys = [
  'pid',
  'hostname',
  'name',
  'level',
  'time',
  'v'
]

var localTime = {
  dateTime: 'YYYY-MM-DD hh:mm:ss.SSS', // '2017-08-05 12:30:45.789'
  dateTimeTZ: 'YYYY-MM-DDThh:mm:ss.SSSTZ', // '2017-08-05T12:30:45.789+08:00'
  time: 'hh:mm:ss',
  milliTime: 'hh:mm:ss.SSS'
}

// cache, compute once for timezone-offset
var tz = _localTimeOffset()

function _localTimeOffset (aMinTimeoffset) {
  // +/- minute timeoffset
  var tz = aMinTimeoffset || new Date().getTimezoneOffset()
  var tmp = Math.abs(tz)
  // es2017
  // var offset = String(Math.floor(tmp / 60)).padStart(2, '0') + ':' + String(tmp % 60).padStart(2, '0')
  var offset = _lpadzero(String(Math.floor(tmp / 60)), 2) + ':' + _lpadzero(String(tmp % 60), 2)
  return tz > 0 ? '-' + offset : '+' + offset
}

function _lpadzero (aTarget, aLength, aPadChar) {
  var char = aPadChar || '0'
  var targetStr = aTarget.toString()
  var times = aLength - targetStr.length
  var padding = ''
  while ((times--) > 0) {
    padding += char
  }
  return padding + targetStr
}

function withSpaces (value) {
  var lines = value.split('\n')
  for (var i = 1; i < lines.length; i++) {
    lines[i] = '    ' + lines[i]
  }
  return lines.join('\n')
}

function filter (value, messageKey) {
  var keys = Object.keys(value)
  var filteredKeys = standardKeys.concat([messageKey])
  var result = ''

  for (var i = 0; i < keys.length; i++) {
    if (filteredKeys.indexOf(keys[i]) < 0) {
      result += '    ' + keys[i] + ': ' + withSpaces(JSON.stringify(value[keys[i]], null, 2)) + '\n'
    }
  }

  return result
}

function isPinoLine (line) {
  return line &&
    line.hasOwnProperty('hostname') &&
    line.hasOwnProperty('pid') &&
    (line.hasOwnProperty('v') && line.v === 1)
}

function pretty (opts) {
  var timeTransOnly = opts && opts.timeTransOnly
  var formatter = opts && opts.formatter
  var levelFirst = opts && opts.levelFirst
  var messageKey = opts && opts.messageKey
  var forceColor = opts && opts.forceColor
  messageKey = messageKey || 'msg'

  var stream = split(mapLine)
  var ctx
  var levelColors

  var pipe = stream.pipe

  stream.pipe = function (dest, opts) {
    ctx = new chalk.constructor({
      enabled: !!((chalk.supportsColor && dest.isTTY) || forceColor)
    })

    levelColors = {
      default: ctx.white,
      60: ctx.bgRed,
      50: ctx.red,
      40: ctx.yellow,
      30: ctx.green,
      20: ctx.blue,
      10: ctx.grey
    }

    pipe.call(stream, dest, opts)
  }

  return stream

  function mapLine (line) {
    var parsed = new Parse(line)
    var value = parsed.value

    if (parsed.err || !isPinoLine(value)) {
      // pass through
      return line + '\n'
    }

    if (formatter) {
      return opts.formatter(parsed.value) + '\n'
    }

    if (timeTransOnly) {
      value.time = asISODate(value.time)
      return JSON.stringify(value) + '\n'
    }

    line = (levelFirst)
        ? asColoredLevel(value) + ' ' + formatTime(value)
        : formatTime(value, ' ') + asColoredLevel(value)

    line += ' ('
    if (value.name) {
      line += value.name + '/'
    }
    line += value.pid + ' on ' + value.hostname + ')'
    line += ': '
    if (value[messageKey]) {
      line += ctx.cyan(value[messageKey])
    }
    line += '\n'
    if (value.type === 'Error') {
      line += '    ' + withSpaces(value.stack) + '\n'
    } else {
      line += filter(value, messageKey)
    }
    return line
  }

  function asISODate (time) {
    return new Date(time).toISOString()
  }

  // TODO:
  // 1. need validate custom format string
  // 2. more format string support
  // 3. unit test
  // 4. parse bin.js custom input format string
  function asLocalDate (aTime, aFormat) {
    var time = aTime
    var format = aFormat
    if (!format) {
      format = localTime.dateTimeTZ
    }
    var date = new Date(time)
    var year = date.getFullYear()
    var month = _lpadzero(date.getMonth() + 1, 2)
    var day = _lpadzero(date.getDate(), 2)
    var hour = _lpadzero(date.getHours(), 2)
    var minute = _lpadzero(date.getMinutes(), 2)
    var second = _lpadzero(date.getSeconds(), 2)
    var milli = _lpadzero(date.getMilliseconds(), 3)

    var _format = format
      .replace(/YYYY/g, year)
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/hh/g, hour)
      .replace(/mm/g, minute)
      .replace(/ss/g, second)
      .replace(/SSS/g, milli)
      .replace(/TZ/g, tz || _localTimeOffset())
    return _format
  }

  function formatTime (value, after) {
    after = after || ''
    try {
      if (!value || !value.time) {
        return ''
      } else {
        return '[' + asLocalDate(value.time) + ']' + after
      }
    } catch (_) {
      return ''
    }
  }

  function asColoredLevel (value) {
    if (levelColors.hasOwnProperty(value.level)) {
      return levelColors[value.level](levels[value.level])
    } else {
      return levelColors.default(levels.default)
    }
  }
}

module.exports = pretty
