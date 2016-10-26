'use strict'
var test = require('tape')
var fresh = require('fresh-require')
var pino = require('../browser')

levelTest('fatal')
levelTest('error')
levelTest('warn')
levelTest('info')
levelTest('debug')
levelTest('trace')

test('throw if creating child without bindings', function (t) {
  t.plan(1)

  var instance = pino()

  t.throws(function () {
    instance.child()
  })
})

test('stubs write, flush and ee methods on instance', function (t) {
  var instance = pino()

  t.ok(isFunc(instance.setMaxListeners))
  t.ok(isFunc(instance.getMaxListeners))
  t.ok(isFunc(instance.emit))
  t.ok(isFunc(instance.addListener))
  t.ok(isFunc(instance.on))
  t.ok(isFunc(instance.prependListener))
  t.ok(isFunc(instance.once))
  t.ok(isFunc(instance.prependOnceListener))
  t.ok(isFunc(instance.removeListener))
  t.ok(isFunc(instance.removeAllListeners))
  t.ok(isFunc(instance.listeners))
  t.ok(isFunc(instance.listenerCount))
  t.ok(isFunc(instance.eventNames))
  t.ok(isFunc(instance.write))
  t.ok(isFunc(instance.flush))

  t.is(instance.on(), undefined)

  t.end()
})

test('exposes levels object', function (t) {
  t.deepEqual(pino.levels, {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10
    },
    labels: {
      '10': 'trace',
      '20': 'debug',
      '30': 'info',
      '40': 'warn',
      '50': 'error',
      '60': 'fatal'
    }
  })
  t.end()
})

test('exposes LOG_VERSION', function (t) {
  t.is(pino.LOG_VERSION, 1)
  t.end()
})

test('exposes faux _Pino constructor', function (t) {
  t.ok(isFunc(pino._Pino))
  t.end()
})

test('exposes faux stdSerializers', function (t) {
  t.ok(pino.stdSerializers)
  t.ok(pino.stdSerializers.req)
  t.ok(pino.stdSerializers.res)
  t.ok(pino.stdSerializers.err)
  t.deepEqual(pino.stdSerializers.req(), {})
  t.deepEqual(pino.stdSerializers.res(), {})
  t.deepEqual(pino.stdSerializers.err(), {})
  t.end()
})

consoleMethodTest('error')
consoleMethodTest('fatal', 'error')
consoleMethodTest('warn')
consoleMethodTest('info')
consoleMethodTest('debug')
consoleMethodTest('trace')
absentConsoleMethodTest('error', 'log')
absentConsoleMethodTest('warn', 'error')
absentConsoleMethodTest('info', 'log')
absentConsoleMethodTest('debug', 'log')
absentConsoleMethodTest('trace', 'log')

test('in absence of console, log methods become noops', function (t) {
  var console = global.console
  delete global.console
  var instance = fresh('../browser', require)()
  global.console = console
  t.is(fnName(instance.log), 'noop')
  t.is(fnName(instance.fatal), 'noop')
  t.is(fnName(instance.error), 'noop')
  t.is(fnName(instance.warn), 'noop')
  t.is(fnName(instance.info), 'noop')
  t.is(fnName(instance.debug), 'noop')
  t.is(fnName(instance.trace), 'noop')
  t.end()
})

test('exposes faux _Pino constructor', function (t) {
  t.ok(isFunc(pino._Pino))
  t.end()
})

function levelTest (name) {
  test(name + ' logs', function (t) {
    var msg = 'hello world'
    sink(name, function (args) {
      t.is(args[0], msg)
      t.end()
    })
    pino({level: name})[name](msg)
  })

  test('passing objects at level ' + name, function (t) {
    var msg = { hello: 'world' }
    sink(name, function (args) {
      t.is(args[0], msg)
      t.end()
    })
    pino({level: name})[name](msg)
  })

  test('passing an object and a string at level ' + name, function (t) {
    var a = { hello: 'world' }
    var b = 'a string'
    sink(name, function (args) {
      t.is(args[0], a)
      t.is(args[1], b)
      t.end()
    })
    pino({level: name})[name](a, b)
  })

  test('formatting logs as ' + name, function (t) {
    sink(name, function (args) {
      t.is(args[0], 'hello %d')
      t.is(args[1], 42)
      t.end()
    })
    pino({level: name})[name]('hello %d', 42)
  })

  test('passing error at level ' + name, function (t) {
    var err = new Error('myerror')
    sink(name, function (args) {
      t.is(args[0], err)
      t.end()
    })
    pino({level: name})[name](err)
  })

  test('passing error with a serializer at level ' + name, function (t) {
    // in browser - should have no effect (should not crash)
    var err = new Error('myerror')
    sink(name, function (args) {
      t.is(args[0].err, err)
      t.end()
    })
    var instance = pino({
      level: name,
      serializers: {
        err: pino.stdSerializers.err
      }
    })
    instance[name]({err: err})
  })

  test('child logger for level ' + name, function (t) {
    var msg = 'hello world'
    var parent = { hello: 'world' }
    sink(name, function (args) {
      t.is(args[0], parent)
      t.is(args[1], msg)
      t.end()
    })
    var instance = pino({level: name})
    var child = instance.child(parent)
    child[name](msg)
  })

  test('child-child logger for level ' + name, function (t) {
    var msg = 'hello world'
    var grandParent = { hello: 'world' }
    var parent = { hello: 'you' }
    sink(name, function (args) {
      t.is(args[0], grandParent)
      t.is(args[1], parent)
      t.is(args[2], msg)
      t.end()
    })
    var instance = pino({level: name})
    var child = instance.child(grandParent).child(parent)
    child[name](msg)
  })
}

function consoleMethodTest (level, method) {
  if (!method) method = level
  test('pino().' + level + ' uses console.' + method, function (t) {
    sink(method, function (args) {
      t.is(args[0], 'test')
      t.end()
    })
    var instance = require('../browser')({level: level})
    instance[level]('test')
  })
}

function absentConsoleMethodTest (method, fallback) {
  test('in absence of console.' + method + ', console.' + fallback + ' is used', function (t) {
    var fn = console[method]
    console[method] = undefined
    sink(fallback, function (args) {
      t.is(args[0], 'test')
      t.end()
      console[method] = fn
    })
    var instance = require('../browser')({level: method})
    instance[method]('test')
  })
}

function isFunc (fn) { return typeof fn === 'function' }
function fnName (fn) {
  var rx = /^\s*function\s*([^\(]*)/i
  var match = rx.exec(fn)
  return match && match[1]
}
function sink (method, fn) {
  if (method === 'fatal') method = 'error'
  var orig = console[method]
  console[method] = function () {
    console[method] = orig
    fn(Array.prototype.slice.call(arguments))
  }
}

