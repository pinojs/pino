'use strict'

const fastDate = require('fast-date')

function nullTime () {
  return ''
}

function epochTime () {
  return ',"time":' + Date.now()
}

const unixTime = fastDate({
  format: 'unix',
  prefix: ',"time":',
  suffix: ''
})

const utcTime = fastDate({
  format: 'utc',
  prefix: ',"time":"',
  suffix: '"'
})

function isoTime () {
  return ',"time": "' + (new Date()).toISOString() + '"'
}

module.exports = {
  nullTime: nullTime,
  epochTime: epochTime,
  unixTime: unixTime,
  utcTime: utcTime,
  isoTime: isoTime,
  defaultTime: utcTime
}
