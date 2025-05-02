'use strict'
const test = require('node:test')
const pino = require('../browser')

test('set the level by string', (t, end) => {
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
    browser: {
      write (actual) {
        checkLogObjects(t.assert.strictEqual, t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set the level by string. init with silent', (t, end) => {
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
    level: 'silent',
    browser: {
      write (actual) {
        checkLogObjects(t.assert.strictEqual, t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set the level by string. init with silent and transmit', (t, end) => {
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
    level: 'silent',
    browser: {
      write (actual) {
        checkLogObjects(t.assert.strictEqual, t.assert.deepStrictEqual, actual, expected.shift())
      }
    },
    transmit: {
      send () {}
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set the level via constructor', (t, end) => {
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

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set custom level and use it', (t, end) => {
  const expected = [
    {
      level: 31,
      msg: 'this is a custom level'
    }
  ]
  const instance = pino({
    customLevels: {
      success: 31
    },
    browser: {
      write (actual) {
        checkLogObjects(t.assert.strictEqual, t.assert.deepStrictEqual, actual, expected.shift())
      }
    }
  })

  instance.success('this is a custom level')

  end()
})

test('the wrong level throws', (t, end) => {
  const instance = pino()
  t.assert.throws(() => {
    instance.level = 'kaboom'
  })
  end()
})

test('the wrong level by number throws', (t, end) => {
  const instance = pino()
  t.assert.throws(() => {
    instance.levelVal = 55
  })
  end()
})

test('exposes level string mappings', (t, end) => {
  t.assert.strictEqual(pino.levels.values.error, 50)
  end()
})

test('exposes level number mappings', (t, end) => {
  t.assert.strictEqual(pino.levels.labels[50], 'error')
  end()
})

test('returns level integer', (t, end) => {
  const instance = pino({ level: 'error' })
  t.assert.strictEqual(instance.levelVal, 50)
  end()
})

test('silent level via constructor', (t, end) => {
  const instance = pino({
    level: 'silent',
    browser: {
      write () {
        t.assert.fail('no data should be logged')
      }
    }
  })

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })

  end()
})

test('silent level by string', (t, end) => {
  const instance = pino({
    browser: {
      write () {
        t.assert.fail('no data should be logged')
      }
    }
  })

  instance.level = 'silent'

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })

  end()
})

test('exposed levels', (t, end) => {
  t.assert.deepStrictEqual(Object.keys(pino.levels.values), [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace'
  ])
  end()
})

test('exposed labels', (t, end) => {
  t.assert.deepStrictEqual(Object.keys(pino.levels.labels), [
    '10',
    '20',
    '30',
    '40',
    '50',
    '60'
  ])
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
