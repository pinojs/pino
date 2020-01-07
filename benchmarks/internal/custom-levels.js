/* eslint-disable no-unused-vars */
'use strict'

const bench = require('fastbench')
const pino = require('../../')

const base = pino(pino.destination('/dev/null'))
const baseCl = pino({
  customLevels: { foo: 31 }
}, pino.destination('/dev/null'))
const child = base.child({})
const childCl = base.child({
  customLevels: { foo: 31 }
})
const childOfBaseCl = baseCl.child({})

const max = 100

const run = bench([
  function benchPinoNoCustomLevel (cb) {
    for (var i = 0; i < max; i++) {
      const obj = base.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoCustomLevel (cb) {
    for (var i = 0; i < max; i++) {
      const obj = baseCl.foo({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchChildNoCustomLevel (cb) {
    for (var i = 0; i < max; i++) {
      const obj = child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildCustomLevel (cb) {
    for (var i = 0; i < max; i++) {
      const obj = childCl.foo({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildInheritedCustomLevel (cb) {
    for (var i = 0; i < max; i++) {
      const obj = childOfBaseCl.foo({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildCreation (cb) {
    const child = base.child({})
    for (var i = 0; i < max; i++) {
      const obj = child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildCreationCustomLevel (cb) {
    const child = base.child({
      customLevels: { foo: 31 }
    })
    for (var i = 0; i < max; i++) {
      const obj = child.foo({ hello: 'world' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
