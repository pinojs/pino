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

module.exports.getNoTime = getNoTime
module.exports.getTime = getTime
module.exports.getSlowTime = getSlowTime
