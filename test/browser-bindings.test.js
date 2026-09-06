'use strict'
const test = require('tape')
const pino = require('../browser')

test('bindings is a function on the root logger', ({ end, is }) => {
  const instance = pino({ browser: {} })

  is(typeof instance.bindings, 'function')
  end()
})

test('bindings returns an empty object on the root logger', ({ end, deepEqual }) => {
  const instance = pino({ browser: {} })

  deepEqual(instance.bindings(), {})
  end()
})

test('bindings returns the child bindings', ({ end, deepEqual }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ a: 1 })

  deepEqual(child.bindings(), { a: 1 })
  end()
})

test('bindings merges parent and child bindings, child wins', ({ end, deepEqual }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ a: 1, b: 1 })
  const grandChild = child.child({ b: 2, c: 3 })

  deepEqual(child.bindings(), { a: 1, b: 1 })
  deepEqual(grandChild.bindings(), { a: 1, b: 2, c: 3 })
  end()
})

test('bindings reflects setBindings updates', ({ end, deepEqual }) => {
  const instance = pino({ browser: {} })

  instance.setBindings({ answer: 42 })
  deepEqual(instance.bindings(), { answer: 42 })

  const child = instance.child({ child: true })
  child.setBindings({ later: 'yes' })
  // the child chain inherits the root bindings set via setBindings
  deepEqual(child.bindings(), { answer: 42, child: true, later: 'yes' })
  end()
})

test('bindings returns a fresh object on each call', ({ end, deepEqual }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ a: 1 })

  const first = child.bindings()
  first.a = 'mutated'
  deepEqual(child.bindings(), { a: 1 })
  end()
})

test('calling bindings does not affect log output', ({ end, is }) => {
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        is(o.a, 1)
        is(o.msg, 'test')
      }
    }
  })

  const child = instance.child({ a: 1 })
  child.bindings()
  child.info('test')
  end()
})
