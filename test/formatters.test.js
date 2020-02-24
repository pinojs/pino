'use strict'
/* eslint no-prototype-builtins: 0 */

const { hostname } = require('os')
const { test } = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

test('level formatter', async ({ match }) => {
  const stream = sink()
  const logger = pino({
    formatters: {
      level (label, number) {
        return {
          log: {
            level: label
          }
        }
      }
    }
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, {
    log: {
      level: 'info'
    }
  })
})

test('bindings formatter', async ({ match }) => {
  const stream = sink()
  const logger = pino({
    formatters: {
      bindings (bindings) {
        return {
          process: {
            pid: bindings.pid
          },
          host: {
            name: bindings.hostname
          }
        }
      }
    }
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  match(await o, {
    process: {
      pid: process.pid
    },
    host: {
      name: hostname()
    }
  })
})

test('log formatter', async ({ match, is }) => {
  const stream = sink()
  const logger = pino({
    formatters: {
      log (obj) {
        is(obj.hasOwnProperty('msg'), false)
        return { hello: 'world', ...obj }
      }
    }
  }, stream)

  const o = once(stream, 'data')
  logger.info({ foo: 'bar', nested: { object: true } }, 'hello world')
  match(await o, {
    hello: 'world',
    foo: 'bar',
    nested: { object: true }
  })
})

test('Formatters combined', async ({ match }) => {
  const stream = sink()
  const logger = pino({
    formatters: {
      level (label, number) {
        return {
          log: {
            level: label
          }
        }
      },
      bindings (bindings) {
        return {
          process: {
            pid: bindings.pid
          },
          host: {
            name: bindings.hostname
          }
        }
      },
      log (obj) {
        return { hello: 'world', ...obj }
      }
    }
  }, stream)

  const o = once(stream, 'data')
  logger.info({ foo: 'bar', nested: { object: true } }, 'hello world')
  match(await o, {
    log: {
      level: 'info'
    },
    process: {
      pid: process.pid
    },
    host: {
      name: hostname()
    },
    hello: 'world',
    foo: 'bar',
    nested: { object: true }
  })
})
