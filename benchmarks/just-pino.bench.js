'use strict'

const bench = require('fastbench')
const pino = require('../')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(dest)
delete require.cache[require.resolve('../')]
const plogDest = require('../')(pino.destination('/dev/null'))
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))
const plogChild = plog.child({a: 'property'})
const plogDestChild = plogDest.child({a: 'property'})
const plogExtremeChild = plogExtreme.child({a: 'property'})
const plogChildChild = plog.child({a: 'property'}).child({sub: 'child'})
const plogDestChildChild = plogDest.child({a: 'property'}).child({sub: 'child'})
const plogExtremeChildChild = plogExtreme.child({a: 'property'}).child({sub: 'child'})

const max = 10

const run = bench([
  function benchPino (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoDest (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoExtreme (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoObj (cb) {
    for (var i = 0; i < max; i++) {
      plog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestObj (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeObj (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild (cb) {
    for (var i = 0; i < max; i++) {
      plogChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestChild (cb) {
    for (var i = 0; i < max; i++) {
      plogDestChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeChild (cb) {
    for (var i = 0; i < max; i++) {
      plogExtremeChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChild (cb) {
    for (var i = 0; i < max; i++) {
      plogChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestChildChild (cb) {
    for (var i = 0; i < max; i++) {
      plogDestChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoExtremeChildChild (cb) {
    for (var i = 0; i < max; i++) {
      plogExtremeChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildCreation (cb) {
    var child = plog.child({ a: 'property' })
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestChildCreation (cb) {
    var child = plogDest.child({ a: 'property' })
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoMulti (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoDestMulti (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info('hello', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoExtremeMulti (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info('hello', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoInterpolate (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolate (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolate (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateAll (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello %s %j %d', 'world', {obj: true}, 4)
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolateAll (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s %j %d', 'world', {obj: true}, 4)
    }
    setImmediate(cb)
  },
  function benchPinoExtremeInterpolateAll (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info('hello %s %j %d', 'world', {obj: true}, 4)
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateExtra (cb) {
    for (var i = 0; i < max; i++) {
      plog.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolateExtra (cb) {
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})
    }
    setImmediate(cb)
  },
  function benchPinoExtremeInterpolateExtra (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})
    }
    setImmediate(cb)
  }
], 10000)

run(run)
