'use strict'
var test = require('tape')
var pino = require('../browser')

test('set the level by string', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
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
        checkLogObjects(is, same, actual, expected.shift())
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set the level by string. init with silent', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
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
        checkLogObjects(is, same, actual, expected.shift())
      }
    }
  })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('set the level by string. init with silent and transmit', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
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
        checkLogObjects(is, same, actual, expected.shift())
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

  end()
})

test('set the level via constructor', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
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
        checkLogObjects(is, same, actual, expected.shift())
      }
    }
  })

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')

  end()
})

test('the wrong level throws', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino()
  throws(function () {
    instance.level = 'kaboom'
  })
  end()
})

test('the wrong level by number throws', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino()
  throws(function () {
    instance.levelVal = 55
  })
  end()
})

test('exposes level string mappings', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  is(pino.levels.values.error, 50)
  end()
})

test('exposes level number mappings', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  is(pino.levels.labels[50], 'error')
  end()
})

test('returns level integer', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({level: 'error'})
  is(instance.levelVal, 50)
  end()
})

test('silent level via constructor', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    level: 'silent',
    browser: {
      write: function (actual) {
        fail('no data should be logged')
      }
    }
  })

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })

  end()
})

test('silent level by string', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (actual) {
        fail('no data should be logged')
      }
    }
  })

  instance.level = 'silent'

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })

  end()
})

test('exposed levels', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  same(Object.keys(pino.levels.values), [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace'
  ])
  end()
})

test('exposed labels', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  same(Object.keys(pino.levels.labels), [
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

  var actualCopy = Object.assign({}, actual)
  var expectedCopy = Object.assign({}, expected)
  delete actualCopy.time
  delete expectedCopy.time

  same(actualCopy, expectedCopy)
}
