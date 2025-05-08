'use strict'
/* eslint no-prototype-builtins: 0 */

const { hostname } = require('node:os')
const { join } = require('node:path')
const { readFile } = require('node:fs').promises
const { test } = require('node:test')
const match = require('@jsumners/assert-match')
const { sink, once, watchFileCreated, file } = require('./helper')
const pino = require('../')

test('level formatter', async (t) => {
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
  }, t)
})

test('bindings formatter', async (t) => {
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
  }, t)
})

test('no bindings formatter', async (t) => {
  const stream = sink()
  const logger = pino({
    formatters: {
      bindings (bindings) {
        return null
      }
    }
  }, stream)

  const o = once(stream, 'data')
  logger.info('hello world')
  const log = await o
  t.assert.ok(!log.hasOwnProperty('pid'))
  t.assert.ok(!log.hasOwnProperty('hostname'))
  match(log, { msg: 'hello world' }, t)
})

test('log formatter', async (t) => {
  const stream = sink()
  const logger = pino({
    formatters: {
      log (obj) {
        t.assert.strictEqual(obj.hasOwnProperty('msg'), false)
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
  }, t)
})

test('Formatters combined', async (t) => {
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
  }, t)
})

test('Formatters in child logger', async (t) => {
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

  const child = logger.child({
    foo: 'bar',
    nested: { object: true }
  }, {
    formatters: {
      bindings (bindings) {
        return { ...bindings, faz: 'baz' }
      }
    }
  })

  const o = once(stream, 'data')
  child.info('hello world')
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
    nested: { object: true },
    faz: 'baz'
  }, t)
})

test('Formatters without bindings in child logger', async (t) => {
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

  const child = logger.child({
    foo: 'bar',
    nested: { object: true }
  }, {
    formatters: {
      log (obj) {
        return { other: 'stuff', ...obj }
      }
    }
  })

  const o = once(stream, 'data')
  child.info('hello world')
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
    foo: 'bar',
    other: 'stuff',
    nested: { object: true }
  }, t)
})

test('elastic common schema format', async (t) => {
  const stream = sink()
  const ecs = {
    formatters: {
      level (label, number) {
        return {
          log: {
            level: label,
            logger: 'pino'
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
        return { ecs: { version: '1.4.0' }, ...obj }
      }
    },
    messageKey: 'message',
    timestamp: () => `,"@timestamp":"${new Date(Date.now()).toISOString()}"`
  }

  const logger = pino({ ...ecs }, stream)

  const o = once(stream, 'data')
  logger.info({ foo: 'bar' }, 'hello world')
  const log = await o
  t.assert.ok(typeof log['@timestamp'] === 'string', '@timestamp is not of type string')
  match(log, {
    log: { level: 'info', logger: 'pino' },
    process: { pid: process.pid },
    host: { name: hostname() },
    ecs: { version: '1.4.0' },
    foo: 'bar',
    message: 'hello world'
  }, t)
})

test('formatter with transport', async (t) => {
  const destination = file()
  const logger = pino({
    formatters: {
      log (obj) {
        t.assert.strictEqual(obj.hasOwnProperty('msg'), false)
        return { hello: 'world', ...obj }
      }
    },
    transport: {
      targets: [
        {
          target: join(__dirname, 'fixtures', 'to-file-transport.js'),
          options: { destination }
        }
      ]
    }
  })

  logger.info({ foo: 'bar', nested: { object: true } }, 'hello world')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  match(result, {
    hello: 'world',
    foo: 'bar',
    nested: { object: true }
  }, t)
})

test('throws when custom level formatter is used with transport.targets', async (t) => {
  t.assert.throws(() => {
    pino({
      formatters: {
        level (label) {
          return label
        }
      },
      transport: {
        targets: [
          {
            target: 'pino/file',
            options: { destination: 'foo.log' }
          }
        ]
      }
    }
    )
  },
  Error('option.transport.targets do not allow custom level formatters'))
})
