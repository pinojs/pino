'use strict'
const test = require('node:test')
const pino = require('../browser')

test('set browser opts disabled to true', (t, end) => {
  const instance = pino({
    browser: {
      disabled: true,
      write (actual) {
        checkLogObjects(t.assert.deepStrictEqual, actual, [])
      }
    }
  })
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set browser opts disabled to false', (t, end) => {
  const expected = [
    {
      level: 30,
      msg: 'hello world'
    },
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
    browser: {
      disabled: false,
      write (actual) {
        checkLogObjects(t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('disabled is not set in browser opts', (t, end) => {
  const expected = [
    {
      level: 30,
      msg: 'hello world'
    },
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
    browser: {
      write (actual) {
        checkLogObjects(t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

function checkLogObjects (same, actual, expected, is) {
  const actualCopy = Object.assign({}, actual)
  const expectedCopy = Object.assign({}, expected)
  delete actualCopy.time
  delete expectedCopy.time

  same(actualCopy, expectedCopy)
}
