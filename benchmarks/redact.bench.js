'use strict'

const bench = require('fastbench')
const pino = require('../')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plog = pino(dest)
delete require.cache[require.resolve('../')]
const plogExtreme = require('../')(pino.extreme('/dev/null'))
delete require.cache[require.resolve('../')]
const plogUnsafe = require('../')({safe: false}, dest)
delete require.cache[require.resolve('../')]
const plogUnsafeExtreme = require('../')(
  {safe: false},
  pino.extreme('/dev/null')
)
const plogRedact = pino({redact: ['a.b.c']}, dest)
delete require.cache[require.resolve('../')]
const plogExtremeRedact = require('../')(
  {redact: ['a.b.c']},
  pino.extreme('/dev/null')
)
delete require.cache[require.resolve('../')]
const plogUnsafeRedact = require('../')({redact: ['a.b.c'], safe: false}, dest)
delete require.cache[require.resolve('../')]
const plogUnsafeExtremeRedact = require('../')(
  {redact: ['a.b.c'], safe: false},
  pino.extreme('/dev/null')
)

const max = 10

// note that "redact me." is the same amount of bytes as the censor: "[Redacted]"

const run = bench([
  function benchPinoNoRedact (cb) {
    for (var i = 0; i < max; i++) {
      plog.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogRedact.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeNoRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafe.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafeRedact.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoExtremeNoRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogExtreme.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoExtremeRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogExtremeRedact.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeExtremeNoRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafeExtreme.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  },
  function benchPinoUnsafeExtremeRedact (cb) {
    for (var i = 0; i < max; i++) {
      plogUnsafeExtremeRedact.info({a: {b: {c: 'redact me.', d: 'leave me'}}})
    }
    setImmediate(cb)
  }
], 10000)

run(run)
