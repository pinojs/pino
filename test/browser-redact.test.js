'use strict'
const test = require('tape')
const pino = require('../browser')

test('redact option with array of paths', ({ end, is, ok }) => {
  const instance = pino({
    redact: ['password'],
    browser: {
      write (o) {
        is(o.user, 'test')
        is(o.password, '[REDACTED]')
        ok(o.time)
      }
    }
  })
  instance.info({ user: 'test', password: 'secret' })
  end()
})

test('redact option with nested paths', ({ end, is }) => {
  const instance = pino({
    redact: ['user.password'],
    browser: {
      write (o) {
        is(o.user.name, 'John')
        is(o.user.password, '[REDACTED]')
      }
    }
  })
  instance.info({ user: { name: 'John', password: 'secret' } })
  end()
})

test('redact option with custom censor', ({ end, is }) => {
  const instance = pino({
    redact: { paths: ['password'], censor: '***' },
    browser: {
      write (o) {
        is(o.password, '***')
      }
    }
  })
  instance.info({ password: 'secret' })
  end()
})

test('redact option with remove', ({ end, is, ok }) => {
  const instance = pino({
    redact: { paths: ['password'], remove: true },
    browser: {
      write (o) {
        is(o.user, 'test')
        ok(!('password' in o))
      }
    }
  })
  instance.info({ user: 'test', password: 'secret' })
  end()
})

test('redact option with multiple paths', ({ end, is }) => {
  const instance = pino({
    redact: ['password', 'secret', 'token'],
    browser: {
      write (o) {
        is(o.user, 'test')
        is(o.password, '[REDACTED]')
        is(o.secret, '[REDACTED]')
        is(o.token, '[REDACTED]')
      }
    }
  })
  instance.info({ user: 'test', password: 'a', secret: 'b', token: 'c' })
  end()
})

test('redact does not affect non-matching properties', ({ end, is }) => {
  const instance = pino({
    redact: ['password'],
    browser: {
      write (o) {
        is(o.user, 'test')
        is(o.email, 'test@test.com')
        is(o.password, '[REDACTED]')
      }
    }
  })
  instance.info({ user: 'test', email: 'test@test.com', password: 'secret' })
  end()
})

test('redact works with child loggers', ({ end, is }) => {
  const instance = pino({
    redact: ['password'],
    browser: {
      write (o) {
        is(o.service, 'auth')
        is(o.password, '[REDACTED]')
      }
    }
  })
  const child = instance.child({ service: 'auth' })
  child.info({ password: 'secret' })
  end()
})

test('redact works with wildcard paths', ({ end, is }) => {
  const instance = pino({
    redact: ['users[*].password'],
    browser: {
      write (o) {
        is(o.users[0].name, 'John')
        is(o.users[0].password, '[REDACTED]')
        is(o.users[1].name, 'Jane')
        is(o.users[1].password, '[REDACTED]')
      }
    }
  })
  instance.info({
    users: [
      { name: 'John', password: 'pass1' },
      { name: 'Jane', password: 'pass2' }
    ]
  })
  end()
})

test('redact in non-asObject mode redacts object arguments', ({ end, is }) => {
  const info = console.info
  console.info = function (obj) {
    is(obj.password, '[REDACTED]')
    is(obj.user, 'test')
    console.info = info
  }
  const instance = pino({
    level: 'info',
    redact: ['password']
  })
  instance.info({ user: 'test', password: 'secret' })
  end()
})

test('redact with formatters', ({ end, is }) => {
  const instance = pino({
    redact: ['password'],
    browser: {
      formatters: {
        level (label, number) {
          return { label, level: number }
        }
      },
      write (o) {
        is(o.label, 'info')
        is(o.password, '[REDACTED]')
      }
    }
  })
  instance.info({ password: 'secret' })
  end()
})

test('redact throws if paths is not an array', ({ end, throws }) => {
  throws(function () {
    pino({ redact: { paths: 'not-an-array' } })
  })
  end()
})

test('redact with censor function', ({ end, is }) => {
  const instance = pino({
    redact: {
      paths: ['password'],
      censor: function (value) {
        return value[0] + '***'
      }
    },
    browser: {
      write (o) {
        is(o.password, 's***')
      }
    }
  })
  instance.info({ password: 'secret' })
  end()
})
