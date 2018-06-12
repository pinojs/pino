'use strict'
var test = require('tape')
var pino = require('../browser')

test('set the level by string', function (t) {
  t.plan(4)
  var expected = [
    {
      level: 50,
      msg: 'this is an error'
    },
    {
      level: 60,
      msg: 'this is fatal'
    }
  ]
  var instance = pino({
    browser: {
      write: function (actual) {
        checkLogObjects(t, actual, expected.shift())
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  t.end()
})

test('set the level by string. init with silent', function (t) {
  t.plan(4)
  var expected = [
    {
      level: 50,
      msg: 'this is an error'
    },
    {
      level: 60,
      msg: 'this is fatal'
    }
  ]
  var instance = pino({
    level: 'silent',
    browser: {
      write: function (actual) {
        checkLogObjects(t, actual, expected.shift())
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  t.end()
})

test('set the level by string. init with silent and transmit', function (t) {
  t.plan(4)
  var expected = [
    {
      level: 50,
      msg: 'this is an error'
    },
    {
      level: 60,
      msg: 'this is fatal'
    }
  ]
  var instance = pino({
    level: 'silent',
    browser: {
      write: function (actual) {
        checkLogObjects(t, actual, expected.shift())
      }
    },
    transmit: {
      send: function () {
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  t.end()
})

test('set the level via constructor', function (t) {
  t.plan(4)
  var expected = [
    {
      level: 50,
      msg: 'this is an error'
    },
    {
      level: 60,
      msg: 'this is fatal'
    }
  ]
  var instance = pino({
    level: 'error',
    browser: {
      write: function (actual) {
        checkLogObjects(t, actual, expected.shift())
      }
    }
  })

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  t.end()
})

test('the wrong level throws', function (t) {
  t.plan(1)
  var instance = pino()
  t.throws(function () {
    instance.level = 'kaboom'
  })
})

test('the wrong level by number throws', function (t) {
  t.plan(1)
  var instance = pino()
  t.throws(function () {
    instance.levelVal = 55
  })
})

test('exposes level string mappings', function (t) {
  t.plan(1)
  t.equal(pino.levels.values.error, 50)
})

test('exposes level number mappings', function (t) {
  t.plan(1)
  t.equal(pino.levels.labels[50], 'error')
})

test('returns level integer', function (t) {
  t.plan(1)
  var instance = pino({level: 'error'})
  t.equal(instance.levelVal, 50)
})

test('silent level via constructor', function (t) {
  var instance = pino({
    level: 'silent',
    browser: {
      write: function (actual) {
        t.fail('no data should be logged')
      }
    }
  })

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('silent level by string', function (t) {
  var instance = pino({
    browser: {
      write: function (actual) {
        t.fail('no data should be logged')
      }
    }
  })

  instance.level = 'silent'

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('exposed levels', function (t) {
  t.plan(1)
  t.deepEqual(Object.keys(pino.levels.values), [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace'
  ])
})

test('exposed labels', function (t) {
  t.plan(1)
  t.deepEqual(Object.keys(pino.levels.labels), [
    '10',
    '20',
    '30',
    '40',
    '50',
    '60'
  ])
})

function checkLogObjects (t, actual, expected) {
  t.ok(actual.time <= Date.now(), 'time is greater than Date.now()')

  var actualCopy = Object.assign({}, actual)
  var expectedCopy = Object.assign({}, expected)
  delete actualCopy.time
  delete expectedCopy.time

  t.deepEqual(actualCopy, expectedCopy)
}
