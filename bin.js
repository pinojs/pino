#! /usr/bin/env node

'use strict'

var pretty = require('./pretty')

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
    messageKey: messageKeyArg()
  })).pipe(process.stdout)
}

function usage () {
  return require('fs')
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
