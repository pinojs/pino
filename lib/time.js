'use strict'

const fastDate = require('fast-date')

function nullTime () {
  return ''
}

function epochTime () {
  return ',"time":' + Date.now()
}

function unixTime () {
  return ',"time":' + Math.round(Date.now() / 1000.0)
}

function utcTime () {
  return ',"time": "' + fastDate() + '"'
}

module.exports = {
  nullTime: nullTime,
  epochTime: epochTime,
  unixTime: unixTime,
  utcTime: utcTime,
  defaultTime: utcTime
}
