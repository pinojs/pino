#! /usr/bin/env node

'use strict'

var pretty = require('./pretty')
var fs = require('fs')

module.exports = pretty

if (arg('-h') || arg('--help')) {
  usage().pipe(process.stdout)
} else if (arg('-v') || arg('--version')) {
  console.log(require('./package.json').version)
} else {
  process.stdin.pipe(pretty({
    timeTransOnly: arg('-t'),
    levelFirst: arg('-l'),
    forceColor: arg('-c'),
    messageKey: argWithParam('-m'),
    dateFormat: argWithParam('--dateFormat'),
    errorProps: paramToArray(argWithParam('--errorProps')),
    errorLikeObjectKeys: paramToArray(argWithParam('--errorLikeObjectKeys')),
    localTime: arg('--localTime')
  })).pipe(process.stdout)
  if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
    process.once('SIGINT', function noOp () {})
  }
}

function usage () {
  var help = require('path').join(__dirname, 'usage.txt')
  return fs.createReadStream(help)
}

function arg (s) {
  return !!~process.argv.indexOf(s)
}

function argWithParam (s) {
  if (!arg(s)) {
    return
  }
  var argIndex = process.argv.indexOf(s) + 1
  var argValue = process.argv.length > argIndex &&
    process.argv[argIndex]

  if (!argValue) {
    throw new Error(s + ' flag provided without a string argument')
  }
  return argValue
}

function paramToArray (param) {
  if (!param) {
    return
  }

  return param.split(/\s?,\s?/)
}
