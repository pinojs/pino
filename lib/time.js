'use strict'

function nullTime () {
  return ''
}

function epochTime () {
  return ',"time":' + Date.now()
}

function slowTime () {
  return ',"time":"' + (new Date()).toISOString() + '"'
}

module.exports = {
  nullTime: nullTime,
  epochTime: epochTime,
  slowTime: slowTime
}
