'use strict'

const test = require('tape')
const pino = require('../browser')

test('bindings returns an empty object on the root logger', ({ end, same }) => {
  const instance = pino({ browser: {} })

  same(instance.bindings(), {})

  end()
})

test('bindings contains child bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ foo: 'bar' })

  same(child.bindings(), { foo: 'bar' })

  end()
})

test('bindings contains bindings from nested children', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance
    .child({ foo: 'bar' })
    .child({ a: 2 })

  same(child.bindings(), { foo: 'bar', a: 2 })

  end()
})

test('child bindings overwrite parent bindings with the same key', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance
    .child({ foo: 'bar' })
    .child({ foo: 'baz' })

  same(child.bindings(), { foo: 'baz' })

  end()
})

test('bindings contains bindings added with setBindings', ({ end, same }) => {
  const instance = pino({ browser: {} })

  instance.setBindings({ foo: 'bar' })

  same(instance.bindings(), { foo: 'bar' })

  end()
})

test('newly set bindings overwrite old bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })

  instance.setBindings({ foo: 'bar' })
  instance.setBindings({ foo: 'baz' })

  same(instance.bindings(), { foo: 'baz' })

  end()
})

test('setBindings on child merges with child bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ child: true })

  child.setBindings({ later: 'yes' })

  same(child.bindings(), {
    child: true,
    later: 'yes'
  })

  end()
})

test('child inherits bindings set on parent before child creation', ({ end, same }) => {
  const instance = pino({ browser: {} })

  instance.setBindings({ foo: 'bar' })

  const child = instance.child({})

  same(child.bindings(), { foo: 'bar' })

  end()
})

test('child does not inherit bindings set on parent after child creation', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({})

  instance.setBindings({ foo: 'bar' })

  same(instance.bindings(), { foo: 'bar' })
  same(child.bindings(), {})

  end()
})

test('bindings returns a copy of the bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })
  instance.setBindings({ foo: 'bar' })

  const bindings = instance.bindings()
  bindings.foo = 'baz'

  same(instance.bindings(), { foo: 'bar' })

  end()
})
