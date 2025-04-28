'use strict'
const test = require('node:test')
const pino = require('../browser')

test('child has parent level', (t, end) => {
  const instance = pino({
    level: 'error',
    browser: {}
  })

  const child = instance.child({})

  t.assert.deepStrictEqual(child.level, instance.level)
  end()
})

test('child can set level at creation time', (t, end) => {
  const instance = pino({
    level: 'error',
    browser: {}
  })

  const child = instance.child({}, { level: 'info' }) // first bindings, then options

  t.assert.deepStrictEqual(child.level, 'info')
  end()
})

test('changing child level does not affect parent', (t, end) => {
  const instance = pino({
    level: 'error',
    browser: {}
  })

  const child = instance.child({})
  child.level = 'info'

  t.assert.deepStrictEqual(instance.level, 'error')
  end()
})

test('child should log, if its own level allows it', (t, end) => {
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
        checkLogObjects(t.assert.strictEqual, t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })

  const child = instance.child({})
  child.level = 'info'

  child.debug('this is debug')
  child.info('this is info')
  child.warn('this is warn')
  child.error('this is an error')

  t.assert.deepStrictEqual(expected.length, 0, 'not all messages were read')
  end()
})

test('changing child log level should not affect parent log behavior', (t, end) => {
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
        checkLogObjects(t.assert.strictEqual, t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })

  const child = instance.child({})
  child.level = 'info'

  instance.warn('this is warn')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  t.assert.deepStrictEqual(expected.length, 0, 'not all messages were read')
  end()
})

test('onChild callback should be called when new child is created', (t, end) => {
  t.plan(1)
  const instance = pino({
    level: 'error',
    browser: {},
    onChild: (_child) => {
      t.assert.ok('onChild callback was called')
      end()
    }
  })

  instance.child({})
})

function checkLogObjects (is, same, actual, expected) {
  is(actual.time <= Date.now(), true, 'time is greater than Date.now()')

  const actualCopy = Object.assign({}, actual)
  const expectedCopy = Object.assign({}, expected)
  delete actualCopy.time
  delete expectedCopy.time

  same(actualCopy, expectedCopy)
}
