'use strict'

function getNoTime () {
  return ''
}

function getTime () {
  return ',"time":' + Date.now()
}

function getSlowTime () {
  return ',"time":"' + (new Date()).toISOString() + '"'
}

module.exports = {
  getNoTime: getNoTime,
  getTime: getTime,
  getSlowTime: getSlowTime
}
