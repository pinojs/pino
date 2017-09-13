'use strict'

function nullTime () {
  return ''
}

function epochTime () {
  return ',"time":' + Math.round(Date.now()/1000.0)
}

function slowTime () {
  return ',"time":"' + (new Date()).toISOString() + '"'
}

module.exports = {
  nullTime: nullTime,
  epochTime: epochTime,
  slowTime: slowTime
}
