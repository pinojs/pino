'use strict'

const bench = require('fastbench')
const pino = require('../../')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(dest)
delete require.cache[require.resolve('../../')]
const plogDest = require('../../')(pino.destination('/dev/null'))
delete require.cache[require.resolve('../../')]
const plogAsync = require('../../')(pino.destination({ dest: '/dev/null', sync: false }))
const plogChild = plog.child({ a: 'property' })
const plogDestChild = plogDest.child({ a: 'property' })
const plogAsyncChild = plogAsync.child({ a: 'property' })
const plogChildChild = plog.child({ a: 'property' }).child({ sub: 'child' })
const plogDestChildChild = plogDest.child({ a: 'property' }).child({ sub: 'child' })
const plogAsyncChildChild = plogAsync.child({ a: 'property' }).child({ sub: 'child' })

const max = 10

const run = bench([
  function benchPino (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plog.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoDest (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoExtreme (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info('hello world')
    }
    setImmediate(cb)
  },
  function benchPinoObj (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plog.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestObj (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoAsyncObj (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChild (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestChild (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDestChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoAsyncChild (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsyncChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildChild (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestChildChild (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDestChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoAsyncChildChild (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsyncChildChild.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoChildCreation (cb) {
    const child = plog.child({ a: 'property' })
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoDestChildCreation (cb) {
    const child = plogDest.child({ a: 'property' })
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      child.info({ hello: 'world' })
    }
    setImmediate(cb)
  },
  function benchPinoMulti (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plog.info('hello', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoDestMulti (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoAsyncMulti (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info('hello', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plog.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plog.info('hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },
  function benchPinoAsyncInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info('hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plog.info('hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  },
  function benchPinoDestInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  },
  function benchPinoAsyncInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info('hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  }
], 10000)

run(run)
