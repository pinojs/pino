'use strict'

const bench = require('fastbench')
const pino = require('../')
const bunyan = require('bunyan')
const bole = require('bole')('bench')
const winston = require('winston')
const fs = require('fs')
const dest = fs.createWriteStream('/dev/null')
const plogNodeStream = pino(dest)
delete require.cache[require.resolve('../')]
const plogDest = require('../')(pino.destination('/dev/null'))
delete require.cache[require.resolve('../')]
const plogAsync = require('../')(pino.destination({ dest: '/dev/null', sync: false, minLength: 4096 }))
delete require.cache[require.resolve('../')]

const deep = require('../package.json')
deep.deep = Object.assign({}, JSON.parse(JSON.stringify(deep)))
deep.deep.deep = Object.assign({}, JSON.parse(JSON.stringify(deep)))
deep.deep.deep.deep = Object.assign({}, JSON.parse(JSON.stringify(deep)))

const blog = bunyan.createLogger({
  name: 'myapp',
  streams: [{
    level: 'trace',
    stream: dest
  }]
})

require('bole').output({
  level: 'info',
  stream: dest
}).setFastTime(true)

const chill = winston.createLogger({
  transports: [
    new winston.transports.Stream({
      stream: fs.createWriteStream('/dev/null')
    })
  ]
})

const max = 10

const run = bench([
  function benchBunyanInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      blog.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchWinstonInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      chill.log('info', 'hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchBoleInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      bole.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoAsyncInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchPinoNodeStreamInterpolate (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogNodeStream.info('hello %s', 'world')
    }
    setImmediate(cb)
  },
  function benchBunyanInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      blog.info('hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },

  function benchWinstonInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      chill.log('info', 'hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },
  function benchBoleInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      bole.info('hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateAll (cb) {
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
  function benchPinoNodeStreamInterpolateAll (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogNodeStream.info('hello %s %j %d', 'world', { obj: true }, 4)
    }
    setImmediate(cb)
  },
  function benchBunyanInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      blog.info('hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  },
  function benchWinstonInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      chill.log('info', 'hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  },
  function benchBoleInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      bole.info('hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateExtra (cb) {
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
  },
  function benchPinoNodeStreamInterpolateExtra (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogNodeStream.info('hello %s %j %d', 'world', { obj: true }, 4, { another: 'obj' })
    }
    setImmediate(cb)
  },
  function benchBunyanInterpolateDeep (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      blog.info('hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchWinstonInterpolateDeep (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      chill.log('info', 'hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchBoleInterpolateDeep (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      bole.info('hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchPinoInterpolateDeep (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogDest.info('hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchPinoAsyncInterpolateDeep (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogAsync.info('hello %j', deep)
    }
    setImmediate(cb)
  },
  function benchPinoNodeStreamInterpolateDeep (cb) {
    /* eslint no-var: off */
    for (var i = 0; i < max; i++) {
      plogNodeStream.info('hello %j', deep)
    }
    setImmediate(cb)
  }
], 10000)

run(run)
