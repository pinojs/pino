#! /usr/bin/env node

'use strict'

var stringifySafe = require('json-stringify-safe')
var split = require('split2')
var Parse = require('fast-json-parse')
var chalk = require('chalk')

process.stdin.pipe(split(mapLine)).pipe(process.stdout)

var levelColors = {
  60: chalk.bgRed,
  50: chalk.red,
  40: chalk.yellow,
  30: chalk.green,
  20: chalk.blue,
  10: chalk.grey
}

var levels = {
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
  'msg',
  'time',
  'v'
]

function asColoredLevel (value) {
  return levelColors[value.level](levels[value.level])
}

function withSpaces (value) {
  var lines = value.split('\n')
  for (var i = 1; i < lines.length; i++) {
    lines[i] = '    ' + lines[i]
  }
  return lines.join('\n')
}

function filter (value) {
  var keys = Object.keys(value)
  var result = ''

  for (var i = 0; i < keys.length; i++) {
    if (standardKeys.indexOf(keys[i]) < 0) {
      result += '    ' + keys[i] + ': ' + withSpaces(stringifySafe(value[keys[i]], null, 2)) + '\n'
    }
  }

  return result
}

function mapLine (line) {
  var parsed = new Parse(line)
  var value = parsed.value

  if (parsed.err) {
    // pass through
    return line
  } else {
    line = '[' + value.time + '] ' + asColoredLevel(value)
    line += ' ('
    if (value.name) {
      line += value.name + '/'
    }
    line += value.pid + ' on ' + value.hostname + ')'
    line += ': ' + chalk.cyan(value.msg) + '\n'
    if (value.type === 'Error') {
      line += '    ' + withSpaces(value.stack) + '\n'
    } else {
      line += filter(value)
    }
    return line
  }
}
