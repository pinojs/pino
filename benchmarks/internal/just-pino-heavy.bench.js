/* eslint-disable no-unused-vars */
'use strict'

const bench = require('fastbench')
const pino = require('../../')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(dest)
delete require.cache[require.resolve('../../')]
const plogDest = require('../../')(pino.destination('/dev/null'))
delete require.cache[require.resolve('../../')]
const plogExtreme = require('../../')(pino.extreme('/dev/null'))
const deep = require('../../package.json')
deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep = JSON.parse(JSON.stringify(deep))
const longStr = JSON.stringify(deep)

const max = 10

const run = bench([
  function benchPinoLongString (cb) {
    for (var i = 0; i < max; i++) {
      const s = plog.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPinoDestLongString (cb) {
    for (var i = 0; i < max; i++) {
      const s = plogDest.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPinoExtremeLongString (cb) {
    for (var i = 0; i < max; i++) {
      const s = plogExtreme.info(longStr)
    }
    setImmediate(cb)
  },
  function benchPinoDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      const s = plog.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoDestDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      const s = plogDest.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoExtremeDeepObj (cb) {
    for (var i = 0; i < max; i++) {
      const s = plogExtreme.info(deep)
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateDeep (cb) {
    for (var i = 0; i < max; i++) {
      const s = plog.info('hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolateDeep (cb) {
    for (var i = 0; i < max; i++) {
      const s = plogDest.info('hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchPinoExtremeInterpolateDeep (cb) {
    for (var i = 0; i < max; i++) {
      const s = plogExtreme.info('hello %j', deep)
    }
    setImmediate(cb)
  }
], 1000)

run(run)
