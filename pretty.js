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

  function formatTime (value, after) {
    after = after || ''
    try {
      if (!value || !value.time) {
        return ''
      } else {
        return '[' + asISODate(value.time) + ']' + after
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
