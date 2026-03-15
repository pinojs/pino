'use strict'
const test = require('tape')
const pino = require('../browser')

test('child has parent level', ({ end, same, is }) => {
  const instance = pino({
    level: 'error',
    browser: {}
  })

  const child = instance.child({})

  same(child.level, instance.level)
  end()
})

test('child can set level at creation time', ({ end, same, is }) => {
  const instance = pino({
    level: 'error',
    browser: {}
  })

  const child = instance.child({}, { level: 'info' }) // first bindings, then options

  same(child.level, 'info')
  end()
})

test('changing child level does not affect parent', ({ end, same, is }) => {
  const instance = pino({
    level: 'error',
    browser: {}
  })

  const child = instance.child({})
  child.level = 'info'

  same(instance.level, 'error')
  end()
})

test('child should log, if its own level allows it', ({ end, same, is }) => {
  const expected = [
    {
      level: 30,
      msg: 'this is info'
    },
    {
      level: 40,
      msg: 'this is warn'
    },
    {
      level: 50,
      msg: 'this is an error'
    }
  ]
  const instance = pino({
    level: 'error',
    browser: {
      write (actual) {
        checkLogObjects(is, same, actual, expected.shift())
      }
    }
  })

  const child = instance.child({})
  child.level = 'info'

  child.debug('this is debug')
  child.info('this is info')
  child.warn('this is warn')
  child.error('this is an error')

  same(expected.length, 0, 'not all messages were read')
  end()
})

test('changing child log level should not affect parent log behavior', ({ end, same, is }) => {
  const expected = [
    {
      level: 50,
      msg: 'this is an error'
    },
    {
      level: 60,
      msg: 'this is fatal'
    }
  ]
  const instance = pino({
    level: 'error',
    browser: {
      write (actual) {
        checkLogObjects(is, same, actual, expected.shift())
      }
    }
  })

  const child = instance.child({})
  child.level = 'info'

  instance.warn('this is warn')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  same(expected.length, 0, 'not all messages were read')
  end()
})

test('onChild callback should be called when new child is created', ({ end, pass, plan }) => {
  plan(1)
  const instance = pino({
    level: 'error',
    browser: {},
    onChild: (_child) => {
      pass('onChild callback was called')
      end()
    }
  })

  instance.child({})
})

test('bindings returns empty object on root logger', ({ end, same }) => {
  const instance = pino({ browser: {} })
  same(instance.bindings(), {})
  end()
})

test('bindings returns child bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ foo: 'bar' })
  same(child.bindings(), { foo: 'bar' })
  end()
})

test('bindings returns merged parent and child bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ foo: 'bar' }).child({ baz: 'bop' })
  same(child.bindings(), { foo: 'bar', baz: 'bop' })
  end()
})

test('setBindings adds bindings to root logger', ({ end, same }) => {
  const instance = pino({ browser: {} })
  instance.setBindings({ foo: 'bar' })
  same(instance.bindings(), { foo: 'bar' })
  end()
})

test('setBindings overwrites existing bindings', ({ end, same }) => {
  const instance = pino({ browser: {} })
  instance.setBindings({ foo: 'bar' })
  instance.setBindings({ foo: 'baz' })
  same(instance.bindings(), { foo: 'baz' })
  end()
})

test('setBindings on child does not affect parent', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ foo: 'bar' })
  child.setBindings({ foo: 'baz' })
  same(child.bindings(), { foo: 'baz' })
  same(instance.bindings(), {})
  end()
})

test('child should have bindings set by parent via setBindings before child creation', ({ end, same }) => {
  const instance = pino({ browser: {} })
  instance.setBindings({ foo: 'bar' })
  const child = instance.child({ baz: 'bop' })
  same(child.bindings(), { foo: 'bar', baz: 'bop' })
  end()
})

test('child should not share bindings of parent set after child creation', ({ end, same }) => {
  const instance = pino({ browser: {} })
  const child = instance.child({ baz: 'bop' })
  instance.setBindings({ foo: 'bar' })
  same(instance.bindings(), { foo: 'bar' })
  same(child.bindings(), { baz: 'bop' })
  end()
})

test('setBindings updates log output in asObject mode', ({ end, is, ok }) => {
  const instance = pino({
    browser: {
      write (actual) {
        is(actual.level, 30)
        is(actual.foo, 'bar')
        is(actual.msg, 'test')
        ok(actual.time)
      }
    }
  })
  instance.setBindings({ foo: 'bar' })
  instance.info('test')
  end()
})

function checkLogObjects (is, same, actual, expected) {
  is(actual.time <= Date.now(), true, 'time is greater than Date.now()')

  const actualCopy = Object.assign({}, actual)
  const expectedCopy = Object.assign({}, expected)
  delete actualCopy.time
  delete expectedCopy.time

  same(actualCopy, expectedCopy)
}
