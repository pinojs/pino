'use strict'

const bench = require('fastbench')
const pino = require('../../')

const base = pino(pino.destination('/dev/null'))
const child = base.child({})
const childChild = child.child({})
const childChildChild = childChild.child({})
const childChildChildChild = childChildChild.child({})
const child2 = base.child({})
const baseSerializers = pino({serializers: {err: () => {}}}, pino.destination('/dev/null'))
const baseSerializersChild = baseSerializers.child({})
const baseSerializersChildSerializers = baseSerializers.child({serializers: {err: () => {}}})

const max = 100

const run = bench([
  function benchPinoBase (cb) {
    for (var i = 0; i < max; i++) {
      base.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild (cb) {
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChild (cb) {
    for (var i = 0; i < max; i++) {
      childChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChildChild (cb) {
    for (var i = 0; i < max; i++) {
      childChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChildChildChild (cb) {
    for (var i = 0; i < max; i++) {
      childChildChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild2 (cb) {
    for (var i = 0; i < max; i++) {
      child2.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoBaseSerilalizers (cb) {
    for (var i = 0; i < max; i++) {
      baseSerializers.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoBaseSerilalizersChild (cb) {
    for (var i = 0; i < max; i++) {
      baseSerializersChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoBaseSerilalizersChildSeriazliers (cb) {
    for (var i = 0; i < max; i++) {
      baseSerializersChildSerializers.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
