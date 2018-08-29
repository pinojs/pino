'use strict'
const test = require('tape')
const pino = require('../browser')

function noop () {}

test('throws if transmit object does not have send function', ({ end, throws }) => {
  throws(() => {
    pino({ browser: { transmit: {} } })
  })

  throws(() => {
    pino({ browser: { transmit: { send: 'not a func' } } })
  })

  end()
})

test('calls send function after write', ({ end, is }) => {
  var c = 0
  const logger = pino({
    browser: {
      write: () => {
        c++
      },
      transmit: {
        send () { is(c, 1) }
      }
    }
  })

  logger.fatal({ test: 'test' })
  end()
})

test('passes send function the logged level', ({ end, is }) => {
  const logger = pino({
    browser: {
      write () {},
      transmit: {
        send (level) {
          is(level, 'fatal')
        }
      }
    }
  })

  logger.fatal({ test: 'test' })
  end()
})

test('passes send function messages in logEvent object', ({ end, same, is }) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, { messages }) {
          same(messages[0], { test: 'test' })
          is(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal({ test: 'test' }, 'another test')
  end()
})

test('supplies a timestamp (ts) in logEvent object which is exactly the same as the `time` property in asObject mode', ({ end, is }) => {
  var expected
  const logger = pino({
    browser: {
      asObject: true, // implict because `write`, but just to be explicit
      write (o) {
        expected = o.time
      },
      transmit: {
        send (level, logEvent) {
          is(logEvent.ts, expected)
        }
      }
    }
  })

  logger.fatal('test')
  end()
})

test('passes send function child bindings via logEvent object', ({ end, same, is }) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          const messages = logEvent.messages
          const bindings = logEvent.bindings
          same(bindings[0], { first: 'binding' })
          same(bindings[1], { second: 'binding2' })
          same(messages[0], { test: 'test' })
          is(messages[1], 'another test')
        }
      }
    }
  })

  logger
    .child({ first: 'binding' })
    .child({ second: 'binding2' })
    .fatal({ test: 'test' }, 'another test')
  end()
})

test('passes send function level:{label, value} via logEvent object', ({ end, is }) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          const label = logEvent.level.label
          const value = logEvent.level.value

          is(label, 'fatal')
          is(value, 60)
        }
      }
    }
  })

  logger.fatal({ test: 'test' }, 'another test')
  end()
})

test('calls send function according to transmit.level', ({ end, is }) => {
  var c = 0
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        level: 'error',
        send (level) {
          c++
          if (c === 1) is(level, 'error')
          if (c === 2) is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('transmit.level defaults to logger level', ({ end, is }) => {
  var c = 0
  const logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        send (level) {
          c++
          if (c === 1) is(level, 'error')
          if (c === 2) is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('transmit.level is effective even if lower than logger level', ({ end, is }) => {
  var c = 0
  const logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        level: 'info',
        send (level) {
          c++
          if (c === 1) is(level, 'warn')
          if (c === 2) is(level, 'error')
          if (c === 3) is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('applies all serializers to messages and bindings (serialize:false - default)', ({ end, same, is }) => {
  const logger = pino({
    serializers: {
      first: () => 'first',
      second: () => 'second',
      test: () => 'serialize it'
    },
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          const messages = logEvent.messages
          const bindings = logEvent.bindings
          same(bindings[0], { first: 'first' })
          same(bindings[1], { second: 'second' })
          same(messages[0], { test: 'serialize it' })
          is(messages[1].type, 'Error')
        }
      }
    }
  })

  logger
    .child({ first: 'binding' })
    .child({ second: 'binding2' })
    .fatal({ test: 'test' }, Error())
  end()
})

test('applies all serializers to messages and bindings (serialize:true)', ({ end, same, is }) => {
  const logger = pino({
    serializers: {
      first: () => 'first',
      second: () => 'second',
      test: () => 'serialize it'
    },
    browser: {
      serialize: true,
      write: noop,
      transmit: {
        send (level, logEvent) {
          const messages = logEvent.messages
          const bindings = logEvent.bindings
          same(bindings[0], { first: 'first' })
          same(bindings[1], { second: 'second' })
          same(messages[0], { test: 'serialize it' })
          is(messages[1].type, 'Error')
        }
      }
    }
  })

  logger
    .child({ first: 'binding' })
    .child({ second: 'binding2' })
    .fatal({ test: 'test' }, Error())
  end()
})
