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

var defaultErrorLikeObjectKeys = [
  'err',
  'error'
]

var defaultMessageKey = 'msg'

function toTimezoneOffset (aMinTimeoffset) {
  // +/- minute timeoffset
  var tz = aMinTimeoffset || new Date().getTimezoneOffset()
  var tmp = Math.abs(tz)

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

function withSpaces (value, eol) {
  var lines = value.split(/\r?\n/)
  for (var i = 1; i < lines.length; i++) {
    lines[i] = '    ' + lines[i]
  }
  return lines.join(eol)
}

function filter (value, messageKey, eol, errorLikeObjectKeys, excludeStandardKeys) {
  errorLikeObjectKeys = errorLikeObjectKeys || []

  var keys = Object.keys(value)
  var filteredKeys = [messageKey]

  if (excludeStandardKeys !== false) {
    filteredKeys = filteredKeys.concat(standardKeys)
  }

  var result = ''

  for (var i = 0; i < keys.length; i++) {
    if (errorLikeObjectKeys.indexOf(keys[i]) !== -1) {
      var arrayOfLines = ('    ' + keys[i] + ': ' + withSpaces(JSON.stringify(value[keys[i]], null, 2), eol) + eol).split('\n')

      for (var j = 0; j < arrayOfLines.length; j++) {
        if (j !== 0) {
          result += '\n'
        }

        var line = arrayOfLines[j]

        if (/^\s*"stack"/.test(line)) {
          var matches = /^(\s*"stack":)\s*"(.*)",?$/.exec(line)

          if (matches) {
            if (matches.length === 3) {
              var indentSize = /^\s*/.exec(line)[0].length + 4
              var indentation = Array(indentSize + 1).join(' ')

              result += matches[1] + '\n' + indentation +
                matches[2].replace(/\\n/g, '\n' + indentation)
            }
          } else {
            result += line
          }
        } else {
          result += line
        }
      }
    } else if (filteredKeys.indexOf(keys[i]) < 0) {
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
  var dateFormat = opts && opts.dateFormat
  var errorProps = opts && opts.errorProps
  var errorLikeObjectKeys = opts && opts.errorLikeObjectKeys
  var localTime = opts && opts.localTime
  var levelFirst = opts && opts.levelFirst
  var messageKey = opts && opts.messageKey
  var forceColor = opts && opts.forceColor
  var eol = opts && opts.crlf ? '\r\n' : '\n'

  messageKey = messageKey || defaultMessageKey
  errorLikeObjectKeys = errorLikeObjectKeys || defaultErrorLikeObjectKeys

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
      value.time = (localTime)
        ? asLocalISODate(value.time, dateFormat)
        : asISODate(value.time, dateFormat)
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
      line += value.stack
        ? '    ' + withSpaces(value.stack, eol) + eol
        : ''

      var propsForPrint
      if (errorProps && errorProps.length > 0) {
        // don't need print these props for 'Error' object
        var excludedProps = standardKeys.concat([messageKey, 'type', 'stack'])

        if (errorProps[0] === '*') {
          // print all value props excluding 'excludedProps'
          propsForPrint = Object.keys(value).filter(function (prop) {
            return excludedProps.indexOf(prop) < 0
          })
        } else {
          // print props from 'errorProps' only
          // but exclude 'excludedProps'
          propsForPrint = errorProps.filter(function (prop) {
            return excludedProps.indexOf(prop) < 0
          })
        }

        for (var i = 0; i < propsForPrint.length; i++) {
          var key = propsForPrint[i]

          if (value.hasOwnProperty(key)) {
            if (value[key] instanceof Object) {
              // call 'filter' with 'excludeStandardKeys' = false
              // because nested property might contain property from 'standardKeys'
              line += key + ': {' + eol + filter(value[key], '', eol, errorLikeObjectKeys, false) + '}' + eol
            } else {
              line += key + ': ' + value[key] + eol
            }
          }
        }
      }
    } else {
      line += filter(value, messageKey, eol, errorLikeObjectKeys)
    }

    return line
  }

  function asISODate (time, dateFormat) {
    if (dateFormat) {
      return asLocalISODate(time, dateFormat, 0)
    } else {
      return new Date(time).toISOString()
    }
  }

  function asLocalISODate (aTime, aFormat, aMinuteTZ) {
    var time = aTime
    var format = aFormat || 'YYYY-MM-DDThh:mm:ss.SSSTZ'
    var date = new Date(time)
    // make independent of the system timezone
    var tzOffset = (aMinuteTZ === undefined)
      ? date.getTimezoneOffset()
      : aMinuteTZ
    date.setUTCMinutes(date.getUTCMinutes() - tzOffset)
    var year = format.indexOf('YYYY') > -1
      ? date.getUTCFullYear()
      : date.getUTCFullYear().toString().slice(2, 4)
    var month = _lpadzero(date.getUTCMonth() + 1, 2)
    var day = _lpadzero(date.getUTCDate(), 2)
    var hour = _lpadzero(date.getUTCHours(), 2)
    var minute = _lpadzero(date.getUTCMinutes(), 2)
    var second = _lpadzero(date.getUTCSeconds(), 2)
    var milli = _lpadzero(date.getUTCMilliseconds(), 3)
    date.setUTCMinutes(date.getUTCMinutes() + tzOffset)

    return format
      .replace(/Y{1,4}/g, year)
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/hh/g, hour)
      .replace(/mm/g, minute)
      .replace(/ss/g, second)
      .replace(/SSS/g, milli)
      .replace(/TZ/g, toTimezoneOffset(tzOffset))
  }

  function formatTime (value, after) {
    after = after || ''
    try {
      if (!value || !value.time) {
        return ''
      } else {
        return '[' + ((localTime)
          ? asLocalISODate(value.time, dateFormat)
          : asISODate(value.time, dateFormat)) + ']' + after
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
