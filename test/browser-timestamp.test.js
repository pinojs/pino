'use strict'
const test = require('node:test')
const pino = require('../browser')

Date.now = () => 1599400603614

test('null timestamp', (t, end) => {
  const instance = pino({
    timestamp: pino.stdTimeFunctions.nullTime,
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.time, undefined)
      }
    }
  })
  instance.info('hello world')
  end()
})

test('iso timestamp', (t, end) => {
  const instance = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.time, '2020-09-06T13:56:43.614Z')
      }
    }
  })
  instance.info('hello world')
  end()
})

test('epoch timestamp', (t, end) => {
  const instance = pino({
    timestamp: pino.stdTimeFunctions.epochTime,
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.time, 1599400603614)
      }
    }
  })
  instance.info('hello world')
  end()
})

test('unix timestamp', (t, end) => {
  const instance = pino({
    timestamp: pino.stdTimeFunctions.unixTime,
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.time, Math.round(1599400603614 / 1000.0))
      }
    }
  })
  instance.info('hello world')
  end()
})

test('epoch timestamp by default', (t, end) => {
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.time, 1599400603614)
      }
    }
  })
  instance.info('hello world')
  end()
})

test('not print timestamp if the option is false', (t, end) => {
  const instance = pino({
    timestamp: false,
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.time, undefined)
      }
    }
  })
  instance.info('hello world')
  end()
})
