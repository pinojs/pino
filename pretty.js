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

function withSpaces (value, eol) {
  var lines = value.split('\r?\n')
  for (var i = 1; i < lines.length; i++) {
    lines[i] = '    ' + lines[i]
  }
  return lines.join(eol)
}

function filter (value, messageKey, eol) {
  var keys = Object.keys(value)
  var filteredKeys = standardKeys.concat([messageKey])
  var result = ''

  for (var i = 0; i < keys.length; i++) {
    if (filteredKeys.indexOf(keys[i]) < 0) {
      result += '    ' + keys[i] + ': ' + withSpaces(JSON.stringify(value[keys[i]], null, 2), eol) + eol
    }
  }

  return result
}

function isPinoLine (line) {
  return line && (line.hasOwnProperty('v') && line.v === 1)
}

function pretty (opts) {
  var timeTransOnly = opts && opts.timeTransOnly
  var formatter = opts && opts.formatter
  var levelFirst = opts && opts.levelFirst
  var messageKey = opts && opts.messageKey
  var forceColor = opts && opts.forceColor
  var eol = opts && opts.crlf ? '\r\n' : '\n'
  messageKey = messageKey || 'msg'

  var stream = split(mapLine)
  var ctx
  var levelColors

  var pipe = stream.pipe

  stream.pipe = function (dest, opts) {
    ctx = new chalk.constructor({
      enabled: !!((chalk.supportsColor && dest.isTTY) || forceColor)
    })

    if (forceColor && ctx.level === 0) {
      ctx.level = 1
    }

    levelColors = {
      default: ctx.white,
      60: ctx.bgRed,
      50: ctx.red,
      40: ctx.yellow,
      30: ctx.green,
      20: ctx.blue,
      10: ctx.grey
    }

    return pipe.call(stream, dest, opts)
  }

  return stream

  function mapLine (line) {
    var parsed = new Parse(line)
    var value = parsed.value

    if (parsed.err || !isPinoLine(value)) {
      // pass through
      return line + eol
    }

    if (timeTransOnly) {
      value.time = asISODate(value.time)
      return JSON.stringify(value) + eol
    }

    line = (levelFirst)
        ? asColoredLevel(value) + ' ' + formatTime(value)
        : formatTime(value, ' ') + asColoredLevel(value)

    if (formatter) {
      return opts.formatter(value, {
        prefix: line,
        chalk: ctx,
        withSpaces: withSpaces,
        filter: filter,
        formatTime: formatTime,
        asColoredText: asColoredText,
        asColoredLevel: asColoredLevel
      }) + eol
    }

    if (value.name || value.pid || value.hostname) {
      line += ' ('

      if (value.name) {
        line += value.name
      }

      if (value.name && value.pid) {
        line += '/' + value.pid
      } else if (value.pid) {
        line += value.pid
      }

      if (value.hostname) {
        line += ' on ' + value.hostname
      }

      line += ')'
    }

    line += ': '

    if (value[messageKey]) {
      line += ctx.cyan(value[messageKey])
    }

    line += eol

    if (value.type === 'Error') {
      line += '    ' + withSpaces(value.stack, eol) + eol
    } else {
      line += filter(value, messageKey, eol)
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
    return asColoredText(value, levelColors.hasOwnProperty(value.level) ? levels[value.level] : levels.default)
  }

  function asColoredText (value, text) {
    if (levelColors.hasOwnProperty(value.level)) {
      return levelColors[value.level](text)
    } else {
      return levelColors.default(text)
    }
  }
}

module.exports = pretty
