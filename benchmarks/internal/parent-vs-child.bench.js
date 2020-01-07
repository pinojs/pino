/* eslint-disable no-unused-vars */
'use strict'

const bench = require('fastbench')
const pino = require('../../')

const base = pino(pino.destination('/dev/null'))
const child = base.child({})
const childChild = child.child({})
const childChildChild = childChild.child({})
const childChildChildChild = childChildChild.child({})
const child2 = base.child({})
const baseSerializers = pino(pino.destination('/dev/null'))
const baseSerializersChild = baseSerializers.child({})
const baseSerializersChildSerializers = baseSerializers.child({})

const max = 100

const run = bench([
  function benchPinoBase (cb) {
    for (var i = 0; i < max; i++) {
      const obj = base.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = childChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = childChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChildChildChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = childChildChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild2 (cb) {
    for (var i = 0; i < max; i++) {
      const obj = child2.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoBaseSerilalizers (cb) {
    for (var i = 0; i < max; i++) {
      const obj = baseSerializers.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoBaseSerilalizersChild (cb) {
    for (var i = 0; i < max; i++) {
      const obj = baseSerializersChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoBaseSerilalizersChildSeriazliers (cb) {
    for (var i = 0; i < max; i++) {
      const obj = baseSerializersChildSerializers.info({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
