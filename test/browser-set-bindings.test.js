'use strict'
const test = require('tape')
const pino = require('../browser')

test('setBindings is a function on the root logger', ({ end, is }) => {
  const instance = pino({ browser: {} })

  is(typeof instance.setBindings, 'function')
  end()
})

test('setBindings adds bindings to subsequent log calls', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        is(o.answer, 42)
        is(o.msg, 'test')
      }
    }
  })

  instance.setBindings({ answer: 42 })
  instance.info('test')
  end()
})

test('setBindings merges with existing bindings', ({ end, is }) => {
  let expected
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        is(o.a, expected.a)
        is(o.b, expected.b)
      }
    }
  })

  instance.setBindings({ a: 1 })
  expected = { a: 1, b: undefined }
  instance.info('first')

  instance.setBindings({ b: 2 })
  expected = { a: 1, b: 2 }
  instance.info('second')
  end()
})

test('setBindings on a child logger merges with the child bindings', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        is(o.child, true)
        is(o.later, 'yes')
        is(o.msg, 'test')
      }
    }
  })

  const child = instance.child({ child: true })
  child.setBindings({ later: 'yes' })
  child.info('test')
  end()
})

test('setBindings works with customLevels', ({ end, is }) => {
  const instance = pino({
    customLevels: { success: 35 },
    browser: {
      asObject: true,
      write: function (o) {
        is(o.answer, 42)
        is(o.msg, 'test')
      }
    }
  })

  instance.setBindings({ answer: 42 })
  instance.success('test')
  end()
})

test('setBindings bindings are transmitted', ({ end, same }) => {
  const instance = pino({
    browser: {
      transmit: {
        send (level, logEvent) {
          same(logEvent.bindings, [{ answer: 42 }])
        }
      }
    }
  })

  instance.setBindings({ answer: 42 })
  instance.info('test')
  end()
})
