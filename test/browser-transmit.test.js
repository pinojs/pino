'use strict'
const test = require('node:test')
const pino = require('../browser')

function noop () {}

test('throws if transmit object does not have send function', (t, end) => {
  t.assert.throws(() => {
    pino({ browser: { transmit: {} } })
  })

  t.assert.throws(() => {
    pino({ browser: { transmit: { send: 'not a func' } } })
  })

  end()
})

test('calls send function after write', (t, end) => {
  let c = 0
  const logger = pino({
    browser: {
      write: () => {
        c++
      },
      transmit: {
        send () { t.assert.strictEqual(c, 1) }
      }
    }
  })

  logger.fatal({ test: 'test' })
  end()
})

test('passes send function the logged level', (t, end) => {
  const logger = pino({
    browser: {
      write () {},
      transmit: {
        send (level) {
          t.assert.strictEqual(level, 'fatal')
        }
      }
    }
  })

  logger.fatal({ test: 'test' })
  end()
})

test('passes send function message strings in logEvent object when asObject is not set', (t, end) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, { messages }) {
          t.assert.strictEqual(messages[0], 'test')
          t.assert.strictEqual(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal('test', 'another test')

  end()
})

test('passes send function message objects in logEvent object when asObject is not set', (t, end) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, { messages }) {
          t.assert.deepStrictEqual(messages[0], { test: 'test' })
          t.assert.strictEqual(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal({ test: 'test' }, 'another test')

  end()
})

test('passes send function message strings in logEvent object when asObject is set', (t, end) => {
  const logger = pino({
    browser: {
      asObject: true,
      write: noop,
      transmit: {
        send (level, { messages }) {
          t.assert.strictEqual(messages[0], 'test')
          t.assert.strictEqual(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal('test', 'another test')

  end()
})

test('passes send function message objects in logEvent object when asObject is set', (t, end) => {
  const logger = pino({
    browser: {
      asObject: true,
      write: noop,
      transmit: {
        send (level, { messages }) {
          t.assert.deepStrictEqual(messages[0], { test: 'test' })
          t.assert.strictEqual(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal({ test: 'test' }, 'another test')

  end()
})

test('supplies a timestamp (ts) in logEvent object which is exactly the same as the `time` property in asObject mode', (t, end) => {
  let expected
  const logger = pino({
    browser: {
      asObject: true, // implicit because `write`, but just to be explicit
      write (o) {
        expected = o.time
      },
      transmit: {
        send (level, logEvent) {
          t.assert.strictEqual(logEvent.ts, expected)
        }
      }
    }
  })

  logger.fatal('test')
  end()
})

test('passes send function child bindings via logEvent object', (t, end) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          const messages = logEvent.messages
          const bindings = logEvent.bindings
          t.assert.deepStrictEqual(bindings[0], { first: 'binding' })
          t.assert.deepStrictEqual(bindings[1], { second: 'binding2' })
          t.assert.deepStrictEqual(messages[0], { test: 'test' })
          t.assert.strictEqual(messages[1], 'another test')
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

test('passes send function level:{label, value} via logEvent object', (t, end) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          const label = logEvent.level.label
          const value = logEvent.level.value

          t.assert.strictEqual(label, 'fatal')
          t.assert.strictEqual(value, 60)
        }
      }
    }
  })

  logger.fatal({ test: 'test' }, 'another test')
  end()
})

test('calls send function according to transmit.level', (t, end) => {
  let c = 0
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        level: 'error',
        send (level) {
          c++
          if (c === 1) t.assert.strictEqual(level, 'error')
          if (c === 2) t.assert.strictEqual(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('transmit.level defaults to logger level', (t, end) => {
  let c = 0
  const logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        send (level) {
          c++
          if (c === 1) t.assert.strictEqual(level, 'error')
          if (c === 2) t.assert.strictEqual(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('transmit.level is effective even if lower than logger level', (t, end) => {
  let c = 0
  const logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        level: 'info',
        send (level) {
          c++
          if (c === 1) t.assert.strictEqual(level, 'warn')
          if (c === 2) t.assert.strictEqual(level, 'error')
          if (c === 3) t.assert.strictEqual(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('applies all serializers to messages and bindings (serialize:false - default)', (t, end) => {
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
          t.assert.deepStrictEqual(bindings[0], { first: 'first' })
          t.assert.deepStrictEqual(bindings[1], { second: 'second' })
          t.assert.deepStrictEqual(messages[0], { test: 'serialize it' })
          t.assert.strictEqual(messages[1].type, 'Error')
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

test('applies all serializers to messages and bindings (serialize:true)', (t, end) => {
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
          t.assert.deepStrictEqual(bindings[0], { first: 'first' })
          t.assert.deepStrictEqual(bindings[1], { second: 'second' })
          t.assert.deepStrictEqual(messages[0], { test: 'serialize it' })
          t.assert.strictEqual(messages[1].type, 'Error')
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

test('extracts correct bindings and raw messages over multiple transmits', (t, end) => {
  let messages = null
  let bindings = null

  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          messages = logEvent.messages
          bindings = logEvent.bindings
        }
      }
    }
  })

  const child = logger.child({ child: true })
  const grandchild = child.child({ grandchild: true })

  logger.fatal({ test: 'parent:test1' })
  logger.fatal({ test: 'parent:test2' })
  t.assert.deepStrictEqual([], bindings)
  t.assert.deepStrictEqual([{ test: 'parent:test2' }], messages)

  child.fatal({ test: 'child:test1' })
  child.fatal({ test: 'child:test2' })
  t.assert.deepStrictEqual([{ child: true }], bindings)
  t.assert.deepStrictEqual([{ test: 'child:test2' }], messages)

  grandchild.fatal({ test: 'grandchild:test1' })
  grandchild.fatal({ test: 'grandchild:test2' })
  t.assert.deepStrictEqual([{ child: true }, { grandchild: true }], bindings)
  t.assert.deepStrictEqual([{ test: 'grandchild:test2' }], messages)

  end()
})

test('does not log below configured level', (t, end) => {
  let message = null
  const logger = pino({
    level: 'info',
    browser: {
      write (o) {
        message = o.msg
      },
      transmit: {
        send () { }
      }
    }
  })

  logger.debug('this message is silent')
  t.assert.strictEqual(message, null)

  end()
})

test('silent level prevents logging even with transmit', (t, end) => {
  const logger = pino({
    level: 'silent',
    browser: {
      write () {
        t.assert.fail('no data should be logged by the write method')
      },
      transmit: {
        send () {
          t.assert.fail('no data should be logged by the send method')
        }
      }
    }
  })

  Object.keys(pino.levels.values).forEach((level) => {
    logger[level]('ignored')
  })

  end()
})

test('does not call send when transmit.level is set to silent', (t, end) => {
  let c = 0
  const logger = pino({
    level: 'trace',
    browser: {
      write () {
        c++
      },
      transmit: {
        level: 'silent',
        send () {
          t.assert.fail('no data should be logged by the transmit method')
        }
      }
    }
  })

  const levels = Object.keys(pino.levels.values)
  levels.forEach((level) => {
    logger[level]('message')
  })

  t.assert.strictEqual(c, levels.length, 'write must be called exactly once per level')
  end()
})
