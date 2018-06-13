'use strict'
var test = require('tape')
var pino = require('../browser')

function noop () {}

test('throws if transmit object does not have send function', function (t) {
  t.throws(function () {
    pino({browser: {transmit: {}}})
  })

  t.throws(function () {
    pino({browser: {transmit: {send: 'not a func'}}})
  })

  t.end()
})

test('calls send function after write', function (t) {
  t.plan(1)
  var c = 0
  var logger = pino({
    browser: {
      write: function (o) {
        c++
      },
      transmit: {
        send: function () {
          t.is(c, 1)
        }
      }
    }
  })

  logger.fatal({test: 'test'})
})

test('passes send function the logged level', function (t) {
  t.plan(1)
  var logger = pino({
    browser: {
      write: function (o) {
      },
      transmit: {
        send: function (level) {
          t.is(level, 'fatal')
        }
      }
    }
  })

  logger.fatal({test: 'test'})
})

test('passes send function messages in logEvent object', function (t) {
  t.plan(2)
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var messages = logEvent.messages
          t.same(messages[0], {test: 'test'})
          t.is(messages[1], 'another test')
        }
      }
    }
  })

  logger.fatal({test: 'test'}, 'another test')
})

test('supplies a timestamp (ts) in logEvent object which is exactly the same as the `time` property in asObject mode', function (t) {
  t.plan(1)
  var expected
  var logger = pino({
    browser: {
      asObject: true, // implict because `write`, but just to be explicit
      write: function (o) {
        expected = o.time
      },
      transmit: {
        send: function (level, logEvent) {
          t.is(logEvent.ts, expected)
        }
      }
    }
  })

  logger.fatal('test')
})

test('passes send function child bindings via logEvent object', function (t) {
  t.plan(4)
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var messages = logEvent.messages
          var bindings = logEvent.bindings
          t.same(bindings[0], {first: 'binding'})
          t.same(bindings[1], {second: 'binding2'})
          t.same(messages[0], {test: 'test'})
          t.is(messages[1], 'another test')
        }
      }
    }
  })

  logger
    .child({first: 'binding'})
    .child({second: 'binding2'})
    .fatal({test: 'test'}, 'another test')
})

test('passes send function level:{label, value} via logEvent object', function (t) {
  t.plan(2)
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        send: function (level, logEvent) {
          var label = logEvent.level.label
          var value = logEvent.level.value

          t.is(label, 'fatal')
          t.is(value, 60)
        }
      }
    }
  })

  logger.fatal({test: 'test'}, 'another test')
})

test('calls send function according to transmit.level', function (t) {
  t.plan(2)
  var c = 0
  var logger = pino({
    browser: {
      write: noop,
      transmit: {
        level: 'error',
        send: function (level) {
          c++
          if (c === 1) t.is(level, 'error')
          if (c === 2) t.is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
})

test('transmit.level defaults to logger level', function (t) {
  t.plan(2)
  var c = 0
  var logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        send: function (level) {
          c++
          if (c === 1) t.is(level, 'error')
          if (c === 2) t.is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
})

test('transmit.level is effective even if lower than logger level', function (t) {
  t.plan(3)
  var c = 0
  var logger = pino({
    level: 'error',
    browser: {
      write: noop,
      transmit: {
        level: 'info',
        send: function (level) {
          c++
          if (c === 1) t.is(level, 'warn')
          if (c === 2) t.is(level, 'error')
          if (c === 3) t.is(level, 'fatal')
        }
      }
    }
  })
  logger.warn('ignored')
  logger.error('test')
  logger.fatal('test')
})

test('applies all serializers to messages and bindings (serialize:false - default)', function (t) {
  t.plan(4)
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
          t.same(bindings[0], {first: 'first'})
          t.same(bindings[1], {second: 'second'})
          t.same(messages[0], {test: 'serialize it'})
          t.is(messages[1].type, 'Error')
        }
      }
    }
  })

  logger
    .child({first: 'binding'})
    .child({second: 'binding2'})
    .fatal({test: 'test'}, Error())
})

test('applies all serializers to messages and bindings (serialize:true)', function (t) {
  t.plan(4)
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
          t.same(bindings[0], {first: 'first'})
          t.same(bindings[1], {second: 'second'})
          t.same(messages[0], {test: 'serialize it'})
          t.is(messages[1].type, 'Error')
        }
      }
    }
  })

  logger
    .child({first: 'binding'})
    .child({second: 'binding2'})
    .fatal({test: 'test'}, Error())
})
