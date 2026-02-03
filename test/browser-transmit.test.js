'use strict'
const test = require('tape')
const pino = require('../browser')
const { logEventToObject } = require('../browser')

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
  let c = 0
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

test('passes send function message strings in logEvent object when asObject is not set', ({ end, same, is }) => {
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, { messages }) {
          is(messages[0], 'test')
          is(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal('test', 'another test')

  end()
})

test('passes send function message objects in logEvent object when asObject is not set', ({ end, same, is }) => {
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

test('passes send function message strings in logEvent object when asObject is set', ({ end, same, is }) => {
  const logger = pino({
    browser: {
      asObject: true,
      write: noop,
      transmit: {
        send (level, { messages }) {
          is(messages[0], 'test')
          is(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal('test', 'another test')

  end()
})

test('passes send function message objects in logEvent object when asObject is set', ({ end, same, is }) => {
  const logger = pino({
    browser: {
      asObject: true,
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
  let expected
  const logger = pino({
    browser: {
      asObject: true, // implicit because `write`, but just to be explicit
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
  let c = 0
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
  let c = 0
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
  let c = 0
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

test('extracts correct bindings and raw messages over multiple transmits', ({ end, same, is }) => {
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
  same([], bindings)
  same([{ test: 'parent:test2' }], messages)

  child.fatal({ test: 'child:test1' })
  child.fatal({ test: 'child:test2' })
  same([{ child: true }], bindings)
  same([{ test: 'child:test2' }], messages)

  grandchild.fatal({ test: 'grandchild:test1' })
  grandchild.fatal({ test: 'grandchild:test2' })
  same([{ child: true }, { grandchild: true }], bindings)
  same([{ test: 'grandchild:test2' }], messages)

  end()
})

test('does not log below configured level', ({ end, is }) => {
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
  is(message, null)

  end()
})

test('silent level prevents logging even with transmit', ({ end, fail }) => {
  const logger = pino({
    level: 'silent',
    browser: {
      write () {
        fail('no data should be logged by the write method')
      },
      transmit: {
        send () {
          fail('no data should be logged by the send method')
        }
      }
    }
  })

  Object.keys(pino.levels.values).forEach((level) => {
    logger[level]('ignored')
  })

  end()
})

test('does not call send when transmit.level is set to silent', ({ end, fail, is }) => {
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
          fail('no data should be logged by the transmit method')
        }
      }
    }
  })

  const levels = Object.keys(pino.levels.values)
  levels.forEach((level) => {
    logger[level]('message')
  })

  is(c, levels.length, 'write must be called exactly once per level')
  end()
})

// logEventToObject tests

test('logEventToObject converts basic logEvent to object', ({ end, is, same }) => {
  const logEvent = {
    ts: 1234567890,
    messages: ['hello world'],
    bindings: [],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent)

  is(result.time, 1234567890)
  is(result.level, 30)
  is(result.msg, 'hello world')
  end()
})

test('logEventToObject merges bindings into object', ({ end, is, same }) => {
  const logEvent = {
    ts: 1234567890,
    messages: ['hello world'],
    bindings: [{ foo: 'foo' }, { bar: 'bar' }],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent)

  is(result.time, 1234567890)
  is(result.level, 30)
  is(result.foo, 'foo')
  is(result.bar, 'bar')
  is(result.msg, 'hello world')
  end()
})

test('logEventToObject extracts merging object from messages', ({ end, is }) => {
  const logEvent = {
    ts: 1234567890,
    messages: [{ requestId: '123' }, 'hello world'],
    bindings: [],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent)

  is(result.time, 1234567890)
  is(result.level, 30)
  is(result.requestId, '123')
  is(result.msg, 'hello world')
  end()
})

test('logEventToObject formats message with arguments', ({ end, is }) => {
  const logEvent = {
    ts: 1234567890,
    messages: ['hello %s!', 'world'],
    bindings: [],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent)

  is(result.msg, 'hello world!')
  end()
})

test('logEventToObject uses custom messageKey', ({ end, is, ok }) => {
  const logEvent = {
    ts: 1234567890,
    messages: ['hello world'],
    bindings: [],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent, { messageKey: 'message' })

  is(result.message, 'hello world')
  ok(!('msg' in result))
  end()
})

test('logEventToObject works with child bindings and merging object', ({ end, is }) => {
  const logEvent = {
    ts: 1234567890,
    messages: [{ requestId: '123' }, 'request %s completed', 'GET /api'],
    bindings: [{ service: 'api' }, { userId: 42 }],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent)

  is(result.time, 1234567890)
  is(result.level, 30)
  is(result.service, 'api')
  is(result.userId, 42)
  is(result.requestId, '123')
  is(result.msg, 'request GET /api completed')
  end()
})

test('logEventToObject does not mutate original logEvent', ({ end, is, same }) => {
  const logEvent = {
    ts: 1234567890,
    messages: [{ requestId: '123' }, 'hello'],
    bindings: [{ foo: 'foo' }],
    level: { label: 'info', value: 30 }
  }

  logEventToObject(logEvent)

  same(logEvent.messages, [{ requestId: '123' }, 'hello'])
  same(logEvent.bindings, [{ foo: 'foo' }])
  end()
})

test('logEventToObject handles empty messages', ({ end, ok }) => {
  const logEvent = {
    ts: 1234567890,
    messages: [],
    bindings: [],
    level: { label: 'info', value: 30 }
  }

  const result = logEventToObject(logEvent)

  ok(!('msg' in result))
  end()
})

test('logEventToObject can be used in transmit.send', ({ end, is }) => {
  let logObject = null
  const logger = pino({
    browser: {
      write: noop,
      transmit: {
        send (level, logEvent) {
          logObject = logEventToObject(logEvent, { messageKey: 'msg' })
        }
      }
    }
  })

  logger
    .child({ service: 'api' })
    .child({ userId: 42 })
    .info({ requestId: '123' }, 'hello %s!', 'world')

  is(logObject.level, 30)
  is(logObject.service, 'api')
  is(logObject.userId, 42)
  is(logObject.requestId, '123')
  is(logObject.msg, 'hello world!')
  end()
})
