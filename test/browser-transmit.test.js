'use strict'
var test = require('tape')
var pino = require('../browser')

function noop () {}

test('throws if transmit object does not have send function', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  throws(function () {
    pino({browser: {transmit: {}}})
  })

  throws(function () {
    pino({browser: {transmit: {send: 'not a func'}}})
  })

  end()
})

test('calls send function after write', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var c = 0
  var logger = pino({
    browser: {
      write: function (o) {
        c++
      },
      transmit: {
        send: function () {
          is(c, 1)
        }
      }
    }
  })

  logger.fatal({test: 'test'})
  end()
})

test('passes send function the logged level', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({
    browser: {
      write: function (o) {
      },
      transmit: {
        send: function (level) {
          is(level, 'fatal')
        }
      }
    }
  })

  logger.fatal({test: 'test'})
  end()
})

test('passes send function messages in logEvent object', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var messages = logEvent.messages
          same(messages[0], {test: 'test'})
          is(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal({test: 'test'}, 'another test')
  end()
})

test('supplies a timestamp (ts) in logEvent object which is exactly the same as the `time` property in asObject mode', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var expected
  var logger = pino({
    browser: {
      asObject: true, // implict because `write`, but just to be explicit
      write: function (o) {
        expected = o.time
      },
      transmit: {
        send: function (level, logEvent) {
          is(logEvent.ts, expected)
        }
      }
    }
  })

  logger.fatal('test')
  end()
})

test('passes send function child bindings via logEvent object', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var messages = logEvent.messages
          var bindings = logEvent.bindings
          same(bindings[0], {first: 'binding'})
          same(bindings[1], {second: 'binding2'})
          same(messages[0], {test: 'test'})
          is(messages[1], 'another test')
        }
      }
    }
  })

  logger
    .child({first: 'binding'})
    .child({second: 'binding2'})
    .fatal({test: 'test'}, 'another test')
  end()
})

test('passes send function level:{label, value} via logEvent object', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var label = logEvent.level.label
          var value = logEvent.level.value

          is(label, 'fatal')
          is(value, 60)
        }
      }
    }
  })

  logger.fatal({test: 'test'}, 'another test')
  end()
})

test('calls send function according to transmit.level', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var c = 0
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        level: 'error',
        send: function (level) {
          c++
          if (c === 1) is(level, 'error')
          if (c === 2) is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('transmit.level defaults to logger level', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var c = 0
  var logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        send: function (level) {
          c++
          if (c === 1) is(level, 'error')
          if (c === 2) is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('transmit.level is effective even if lower than logger level', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var c = 0
  var logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        level: 'info',
        send: function (level) {
          c++
          if (c === 1) is(level, 'warn')
          if (c === 2) is(level, 'error')
          if (c === 3) is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
  end()
})

test('applies all serializers to messages and bindings (serialize:false - default)', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({
    serializers: {
      first: function () { return 'first' },
      second: function () { return 'second' },
      test: function () { return 'serialize it' }
    },
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var messages = logEvent.messages
          var bindings = logEvent.bindings
          same(bindings[0], {first: 'first'})
          same(bindings[1], {second: 'second'})
          same(messages[0], {test: 'serialize it'})
          is(messages[1].type, 'Error')
        }
      }
    }
  })

  logger
    .child({first: 'binding'})
    .child({second: 'binding2'})
    .fatal({test: 'test'}, Error())
  end()
})

test('applies all serializers to messages and bindings (serialize:true)', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var logger = pino({
    serializers: {
      first: function () { return 'first' },
      second: function () { return 'second' },
      test: function () { return 'serialize it' }
    },
    browser: {
      serialize: true,
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var messages = logEvent.messages
          var bindings = logEvent.bindings
          same(bindings[0], {first: 'first'})
          same(bindings[1], {second: 'second'})
          same(messages[0], {test: 'serialize it'})
          is(messages[1].type, 'Error')
        }
      }
    }
  })

  logger
    .child({first: 'binding'})
    .child({second: 'binding2'})
    .fatal({test: 'test'}, Error())
  end()
})
