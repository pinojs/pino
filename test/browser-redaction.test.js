'use strict'
// eslint-disable-next-line
if (typeof $1 !== 'undefined') $1 = arguments.callee.caller.arguments[0]

const test = require('tape')
const pino = require('../browser')

test('redact option as array redacts specified paths', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.password, '[Redacted]')
        is(o.username, 'john')
        end()
      }
    },
    redact: ['password']
  })

  instance.info({ password: 'secret', username: 'john' })
})

test('redact option as object with custom censor', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.secret, '***HIDDEN***')
        is(o.visible, 'data')
        end()
      }
    },
    redact: {
      paths: ['secret'],
      censor: '***HIDDEN***'
    }
  })

  instance.info({ secret: 'sensitive', visible: 'data' })
})

test('redact nested paths', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.user.password, '[Redacted]')
        is(o.user.name, 'alice')
        end()
      }
    },
    redact: ['user.password']
  })

  instance.info({ user: { name: 'alice', password: 'secret123' } })
})

test('redact with wildcard paths', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.items[0].secret, '[Redacted]')
        is(o.items[1].secret, '[Redacted]')
        is(o.items[0].id, 1)
        is(o.items[1].id, 2)
        end()
      }
    },
    redact: ['items[*].secret']
  })

  instance.info({
    items: [
      { id: 1, secret: 'a' },
      { id: 2, secret: 'b' }
    ]
  })
})

test('redact with remove option removes the key entirely', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.removeMe, undefined)
        is(o.keepMe, 'visible')
        end()
      }
    },
    redact: {
      paths: ['removeMe'],
      remove: true
    }
  })

  instance.info({ removeMe: 'gone', keepMe: 'visible' })
})

test('redact throws on invalid paths option', ({ end, throws }) => {
  throws(() => {
    pino({
      browser: { asObject: true },
      redact: { paths: 'not-an-array' }
    })
  }, /pino – redact must contain an array of strings/)
  end()
})

test('redact works with child loggers', ({ end, is }) => {
  const parent = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.password, '[Redacted]')
        is(o.childBinding, 'value')
        end()
      }
    },
    redact: ['password']
  })

  const child = parent.child({ childBinding: 'value' })
  child.info({ password: 'secret' })
})

test('redact multiple paths', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.password, '[Redacted]')
        is(o.creditCard, '[Redacted]')
        is(o.ssn, '[Redacted]')
        is(o.name, 'bob')
        end()
      }
    },
    redact: ['password', 'creditCard', 'ssn']
  })

  instance.info({
    password: 'secret',
    creditCard: '1234-5678-9012-3456',
    ssn: '123-45-6789',
    name: 'bob'
  })
})

test('redact with bracket notation for hyphenated keys', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o['api-key'], '[Redacted]')
        is(o.name, 'test')
        end()
      }
    },
    redact: ['["api-key"]']
  })

  instance.info({ 'api-key': 'sensitive', name: 'test' })
})

test('redact works with asObjectBindingsOnly mode', ({ end, is, deepEqual }) => {
  const instance = pino({
    browser: {
      asObjectBindingsOnly: true,
      write (o, ...args) {
        is(o.password, '[Redacted]')
        is(o.username, 'john')
        deepEqual(args, ['remaining', 'args'])
        end()
      }
    },
    redact: ['password']
  })

  instance.info({ password: 'secret', username: 'john' }, 'remaining', 'args')
})

test('redact works with asObjectBindingsOnly mode and object message', ({ end, is, ok }) => {
  const instance = pino({
    browser: {
      asObjectBindingsOnly: true,
      write (o, ...args) {
        is(o.password, '[Redacted]')
        is(o.foo, 'bar')
        ok(o.time)
        is(args.length, 0)
        end()
      }
    },
    redact: ['password']
  })

  instance.info({ password: 'secret', foo: 'bar' })
})

test('redact with asObjectBindingsOnly and child logger merges multiple bindings', ({ end, is, ok }) => {
  const parent = pino({
    browser: {
      asObjectBindingsOnly: true,
      write (o, ...args) {
        is(o.password, '[Redacted]')
        is(o.parentBinding, 'parent')
        is(o.childBinding, 'child')
        is(o.logData, 'value')
        ok(o.time)
        end()
      }
    },
    redact: ['password']
  })

  const child = parent.child({ parentBinding: 'parent' }).child({ childBinding: 'child' })
  child.info({ logData: 'value', password: 'secret' })
})

test('formatters.level works with asObject mode', ({ end, is, ok }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.levelLabel, 'info')
        is(o.levelValue, 30)
        is(o.msg, 'test message')
        ok(o.time)
        end()
      },
      formatters: {
        level (label, number) {
          return { levelLabel: label, levelValue: number }
        }
      }
    }
  })

  instance.info('test message')
})

test('formatters.level with asObject and object message', ({ end, is, ok }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write (o) {
        is(o.levelLabel, 'warn')
        is(o.levelValue, 40)
        is(o.data, 'value')
        ok(o.time)
        end()
      },
      formatters: {
        level (label, number) {
          return { levelLabel: label, levelValue: number }
        }
      }
    }
  })

  instance.warn({ data: 'value' })
})
