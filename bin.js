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
    messageKey: messageKeyArg(),
    dateFormat: dateFormat(),
    errorProps: errorPropsArg(),
    localTime: arg('--localTime')
  })).pipe(process.stdout)
  if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
    process.once('SIGINT', function noOp () {})
  }
}

function usage () {
  return fs
      .createReadStream(require('path').join(__dirname, 'usage.txt'))
}

function arg (s) {
  return !!~process.argv.indexOf(s)
}

function messageKeyArg () {
  if (!arg('-m')) {
    return
  }
  var messageKeyIndex = process.argv.indexOf('-m') + 1
  var messageKey = process.argv.length > messageKeyIndex &&
    process.argv[messageKeyIndex]

  if (!messageKey) {
    throw new Error('-m flag provided without a string argument')
  }
  return messageKey
}

function dateFormat () {
  if (!arg('--dateFormat')) {
    return
  }
  var dateFormatIndex = process.argv.indexOf('--dateFormat') + 1
  var dateFormat = process.argv.length > dateFormatIndex &&
    process.argv[dateFormatIndex]
  if (!dateFormat) {
    throw new Error('--dateFormat flag provided without a string argument')
  }
  return dateFormat
}

function errorPropsArg () {
  if (!arg('--errorProps')) {
    return
  }
  var errorPropsIndex = process.argv.indexOf('--errorProps') + 1
  var errorProps = process.argv.length > errorPropsIndex &&
    process.argv[errorPropsIndex]
  if (!errorProps) {
    throw new Error('--errorProps flag provided without a string argument')
  }
  var errorPropsArr = errorProps.split(',')
  return errorPropsArr
}
