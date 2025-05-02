'use strict'
const test = require('node:test')
const fresh = require('import-fresh')
const pinoStdSerializers = require('pino-std-serializers')
const pino = require('../browser')

levelTest('fatal')
levelTest('error')
levelTest('warn')
levelTest('info')
levelTest('debug')
levelTest('trace')

test('silent level', (t, end) => {
  const instance = pino({
    level: 'silent',
    browser: { write: t.assert.fail }
  })
  instance.info('test')
  const child = instance.child({ test: 'test' })
  child.info('msg-test')
  // use setTimeout because setImmediate isn't supported in most browsers
  setTimeout(() => {
    t.assert.ok('silent level is working')
    end()
  }, 0)
})

test('enabled false', (t, end) => {
  const instance = pino({
    enabled: false,
    browser: { write: t.assert.fail }
  })
  instance.info('test')
  const child = instance.child({ test: 'test' })
  child.info('msg-test')
  // use setTimeout because setImmediate isn't supported in most browsers
  setTimeout(() => {
    t.assert.ok('enabled false is working')
    end()
  }, 0)
})

test('throw if creating child without bindings', (t, end) => {
  const instance = pino()
  t.assert.throws(() => instance.child())
  end()
})

test('stubs write, flush and ee methods on instance', (t, end) => {
  const instance = pino()

  t.assert.ok(isFunc(instance.setMaxListeners))
  t.assert.ok(isFunc(instance.getMaxListeners))
  t.assert.ok(isFunc(instance.emit))
  t.assert.ok(isFunc(instance.addListener))
  t.assert.ok(isFunc(instance.on))
  t.assert.ok(isFunc(instance.prependListener))
  t.assert.ok(isFunc(instance.once))
  t.assert.ok(isFunc(instance.prependOnceListener))
  t.assert.ok(isFunc(instance.removeListener))
  t.assert.ok(isFunc(instance.removeAllListeners))
  t.assert.ok(isFunc(instance.listeners))
  t.assert.ok(isFunc(instance.listenerCount))
  t.assert.ok(isFunc(instance.eventNames))
  t.assert.ok(isFunc(instance.write))
  t.assert.ok(isFunc(instance.flush))

  t.assert.strictEqual(instance.on(), undefined)

  end()
})

test('exposes levels object', (t, end) => {
  t.assert.deepStrictEqual(pino.levels, {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10
    },
    labels: {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal'
    }
  })

  end()
})

test('exposes faux stdSerializers', (t, end) => {
  t.assert.ok(pino.stdSerializers)
  // make sure faux stdSerializers match pino-std-serializers
  for (const serializer in pinoStdSerializers) {
    t.assert.ok(pino.stdSerializers[serializer], `pino.stdSerializers.${serializer}`)
  }
  // confirm faux methods return empty objects
  t.assert.deepStrictEqual(pino.stdSerializers.req(), {})
  t.assert.deepStrictEqual(pino.stdSerializers.mapHttpRequest(), {})
  t.assert.deepStrictEqual(pino.stdSerializers.mapHttpResponse(), {})
  t.assert.deepStrictEqual(pino.stdSerializers.res(), {})
  // confirm wrapping function is a passthrough
  const noChange = { foo: 'bar', fuz: 42 }
  t.assert.deepStrictEqual(pino.stdSerializers.wrapRequestSerializer(noChange), noChange)
  t.assert.deepStrictEqual(pino.stdSerializers.wrapResponseSerializer(noChange), noChange)
  end()
})

test('exposes err stdSerializer', (t, end) => {
  t.assert.ok(pino.stdSerializers.err)
  t.assert.ok(pino.stdSerializers.err(Error()))
  end()
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

// do not run this with airtap
if (process.title !== 'browser') {
  test('in absence of console, log methods become noops', (t, end) => {
    const console = global.console
    delete global.console
    const instance = fresh('../browser')()
    global.console = console
    t.assert.ok(fnName(instance.log).match(/noop/))
    t.assert.ok(fnName(instance.fatal).match(/noop/))
    t.assert.ok(fnName(instance.error).match(/noop/))
    t.assert.ok(fnName(instance.warn).match(/noop/))
    t.assert.ok(fnName(instance.info).match(/noop/))
    t.assert.ok(fnName(instance.debug).match(/noop/))
    t.assert.ok(fnName(instance.trace).match(/noop/))
    end()
  })
}

test('opts.browser.asObject logs pino-like object to console', (t, end) => {
  const info = console.info
  console.info = function (o) {
    t.assert.strictEqual(o.level, 30)
    t.assert.strictEqual(o.msg, 'test')
    t.assert.ok(o.time)
    console.info = info
  }
  const instance = require('../browser')({
    browser: {
      asObject: true
    }
  })

  instance.info('test')
  end()
})

test('opts.browser.asObject uses opts.messageKey in logs', (t, end) => {
  const messageKey = 'message'
  const instance = require('../browser')({
    messageKey,
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o[messageKey], 'test')
        t.assert.ok(o.time)
      }
    }
  })

  instance.info('test')
  end()
})

test('opts.browser.asObjectBindingsOnly passes the bindings but keep the message unformatted', (t, end) => {
  const messageKey = 'message'
  const instance = require('../browser')({
    messageKey,
    browser: {
      asObjectBindingsOnly: true,
      write: function (o, msg, ...args) {
        t.assert.strictEqual(o.level, 30)
        t.assert.ok(o.time)
        t.assert.strictEqual(msg, 'test %s')
        t.assert.deepStrictEqual(args, ['foo'])
      }
    }
  })

  instance.info('test %s', 'foo')
  end()
})

test('opts.browser.formatters (level) logs pino-like object to console', (t, end) => {
  const info = console.info
  console.info = function (o) {
    t.assert.strictEqual(o.level, 30)
    t.assert.strictEqual(o.label, 'info')
    t.assert.strictEqual(o.msg, 'test')
    t.assert.ok(o.time)
    console.info = info
  }
  const instance = require('../browser')({
    browser: {
      formatters: {
        level (label, number) {
          return { label, level: number }
        }
      }
    }
  })

  instance.info('test')
  end()
})

test('opts.browser.formatters (log) logs pino-like object to console', (t, end) => {
  const info = console.info
  console.info = function (o) {
    t.assert.strictEqual(o.level, 30)
    t.assert.strictEqual(o.msg, 'test')
    t.assert.strictEqual(o.hello, 'world')
    t.assert.strictEqual(o.newField, 'test')
    t.assert.ok(o.time, `Logged at ${o.time}`)
    console.info = info
  }
  const instance = require('../browser')({
    browser: {
      formatters: {
        log (o) {
          return { ...o, newField: 'test', time: `Logged at ${o.time}` }
        }
      }
    }
  })

  instance.info({ hello: 'world' }, 'test')
  end()
})

test('opts.browser.serialize and opts.browser.transmit only serializes log data once', (t, end) => {
  const instance = require('../browser')({
    serializers: {
      extras (data) {
        return { serializedExtras: data }
      }
    },
    browser: {
      serialize: ['extras'],
      transmit: {
        level: 'info',
        send (level, o) {
          t.assert.strictEqual(o.messages[0].extras.serializedExtras, 'world')
        }
      }
    }
  })

  instance.info({ extras: 'world' }, 'test')
  end()
})

test('opts.browser.serialize and opts.asObject only serializes log data once', (t, end) => {
  const instance = require('../browser')({
    serializers: {
      extras (data) {
        return { serializedExtras: data }
      }
    },
    browser: {
      serialize: ['extras'],
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.extras.serializedExtras, 'world')
      }
    }
  })

  instance.info({ extras: 'world' }, 'test')
  end()
})

test('opts.browser.serialize, opts.asObject and opts.browser.transmit only serializes log data once', (t, end) => {
  const instance = require('../browser')({
    serializers: {
      extras (data) {
        return { serializedExtras: data }
      }
    },
    browser: {
      serialize: ['extras'],
      asObject: true,
      transmit: {
        send (level, o) {
          t.assert.strictEqual(o.messages[0].extras.serializedExtras, 'world')
        }
      }
    }
  })

  instance.info({ extras: 'world' }, 'test')
  end()
})

test('opts.browser.write func log single string', (t, end) => {
  const instance = pino({
    browser: {
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 'test')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info('test')

  end()
})

test('opts.browser.write func string joining', (t, end) => {
  const instance = pino({
    browser: {
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 'test test2 test3')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info('test %s %s', 'test2', 'test3')

  end()
})

test('opts.browser.write func string joining when asObject is true', (t, end) => {
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 'test test2 test3')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info('test %s %s', 'test2', 'test3')

  end()
})

test('opts.browser.write func string object joining', (t, end) => {
  const instance = pino({
    browser: {
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 'test {"test":"test2"} {"test":"test3"}')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info('test %j %j', { test: 'test2' }, { test: 'test3' })

  end()
})

test('opts.browser.write func string object joining when asObject is true', (t, end) => {
  const instance = pino({
    browser: {
      asObject: true,
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 'test {"test":"test2"} {"test":"test3"}')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info('test %j %j', { test: 'test2' }, { test: 'test3' })

  end()
})

test('opts.browser.write func string interpolation', (t, end) => {
  const instance = pino({
    browser: {
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 'test2 test ({"test":"test3"})')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info('%s test (%j)', 'test2', { test: 'test3' })

  end()
})

test('opts.browser.write func number', (t, end) => {
  const instance = pino({
    browser: {
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.msg, 1)
        t.assert.ok(o.time)
      }
    }
  })
  instance.info(1)

  end()
})

test('opts.browser.write func log single object', (t, end) => {
  const instance = pino({
    browser: {
      write: function (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.test, 'test')
        t.assert.ok(o.time)
      }
    }
  })
  instance.info({ test: 'test' })

  end()
})

test('opts.browser.write obj writes to methods corresponding to level', (t, end) => {
  const instance = pino({
    browser: {
      write: {
        error: function (o) {
          t.assert.strictEqual(o.level, 50)
          t.assert.strictEqual(o.test, 'test')
          t.assert.ok(o.time)
        }
      }
    }
  })
  instance.error({ test: 'test' })

  end()
})

test('opts.browser.asObject/write supports child loggers', (t, end) => {
  const instance = pino({
    browser: {
      write (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.test, 'test')
        t.assert.strictEqual(o.msg, 'msg-test')
        t.assert.ok(o.time)
      }
    }
  })
  const child = instance.child({ test: 'test' })
  child.info('msg-test')

  end()
})

test('opts.browser.asObject/write supports child child loggers', (t, end) => {
  const instance = pino({
    browser: {
      write (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.test, 'test')
        t.assert.strictEqual(o.foo, 'bar')
        t.assert.strictEqual(o.msg, 'msg-test')
        t.assert.ok(o.time)
      }
    }
  })
  const child = instance.child({ test: 'test' }).child({ foo: 'bar' })
  child.info('msg-test')

  end()
})

test('opts.browser.asObject/write supports child child child loggers', (t, end) => {
  const instance = pino({
    browser: {
      write (o) {
        t.assert.strictEqual(o.level, 30)
        t.assert.strictEqual(o.test, 'test')
        t.assert.strictEqual(o.foo, 'bar')
        t.assert.strictEqual(o.baz, 'bop')
        t.assert.strictEqual(o.msg, 'msg-test')
        t.assert.ok(o.time)
      }
    }
  })
  const child = instance.child({ test: 'test' }).child({ foo: 'bar' }).child({ baz: 'bop' })
  child.info('msg-test')

  end()
})

test('opts.browser.asObject defensively mitigates naughty numbers', (t, end) => {
  const instance = pino({
    browser: { asObject: true, write: () => {} }
  })
  const child = instance.child({ test: 'test' })
  child._childLevel = -10
  child.info('test')
  t.assert.ok('no infinite loop') // if we reached here, there was no infinite loop, so, .. pass.

  end()
})

test('opts.browser.write obj falls back to console where a method is not supplied', (t, end) => {
  const info = console.info
  console.info = (o) => {
    t.assert.strictEqual(o.level, 30)
    t.assert.strictEqual(o.msg, 'test')
    t.assert.ok(o.time)
    console.info = info
  }
  const instance = require('../browser')({
    browser: {
      write: {
        error (o) {
          t.assert.strictEqual(o.level, 50)
          t.assert.strictEqual(o.test, 'test')
          t.assert.ok(o.time)
        }
      }
    }
  })
  instance.error({ test: 'test' })
  instance.info('test')

  end()
})

function levelTest (name) {
  test(name + ' logs', (t, end) => {
    const msg = 'hello world'
    sink(name, (args) => {
      t.assert.strictEqual(args[0], msg)
      end()
    })
    pino({ level: name })[name](msg)
  })

  test('passing objects at level ' + name, (t, end) => {
    const msg = { hello: 'world' }
    sink(name, (args) => {
      t.assert.strictEqual(args[0], msg)
      end()
    })
    pino({ level: name })[name](msg)
  })

  test('passing an object and a string at level ' + name, (t, end) => {
    const a = { hello: 'world' }
    const b = 'a string'
    sink(name, (args) => {
      t.assert.strictEqual(args[0], a)
      t.assert.strictEqual(args[1], b)
      end()
    })
    pino({ level: name })[name](a, b)
  })

  test('formatting logs as ' + name, (t, end) => {
    sink(name, (args) => {
      t.assert.strictEqual(args[0], 'hello %d')
      t.assert.strictEqual(args[1], 42)
      end()
    })
    pino({ level: name })[name]('hello %d', 42)
  })

  test('passing error at level ' + name, (t, end) => {
    const err = new Error('myerror')
    sink(name, (args) => {
      t.assert.strictEqual(args[0], err)
      end()
    })
    pino({ level: name })[name](err)
  })

  test('passing error with a serializer at level ' + name, (t, end) => {
    // in browser - should have no effect (should not crash)
    const err = new Error('myerror')
    sink(name, (args) => {
      t.assert.strictEqual(args[0].err, err)
      end()
    })
    const instance = pino({
      level: name,
      serializers: {
        err: pino.stdSerializers.err
      }
    })
    instance[name]({ err })
  })

  test('child logger for level ' + name, (t, end) => {
    const msg = 'hello world'
    const parent = { hello: 'world' }
    sink(name, (args) => {
      t.assert.strictEqual(args[0], parent)
      t.assert.strictEqual(args[1], msg)
      end()
    })
    const instance = pino({ level: name })
    const child = instance.child(parent)
    child[name](msg)
  })

  test('child-child logger for level ' + name, (t, end) => {
    const msg = 'hello world'
    const grandParent = { hello: 'world' }
    const parent = { hello: 'you' }
    sink(name, (args) => {
      t.assert.strictEqual(args[0], grandParent)
      t.assert.strictEqual(args[1], parent)
      t.assert.strictEqual(args[2], msg)
      end()
    })
    const instance = pino({ level: name })
    const child = instance.child(grandParent).child(parent)
    child[name](msg)
  })
}

function consoleMethodTest (level, method) {
  if (!method) method = level
  test('pino().' + level + ' uses console.' + method, (t, end) => {
    sink(method, (args) => {
      t.assert.strictEqual(args[0], 'test')
      end()
    })
    const instance = require('../browser')({ level })
    instance[level]('test')
  })
}

function absentConsoleMethodTest (method, fallback) {
  test('in absence of console.' + method + ', console.' + fallback + ' is used', (t, end) => {
    const fn = console[method]
    console[method] = undefined
    sink(fallback, function (args) {
      t.assert.strictEqual(args[0], 'test')
      end()
      console[method] = fn
    })
    const instance = require('../browser')({ level: method })
    instance[method]('test')
  })
}

function isFunc (fn) { return typeof fn === 'function' }
function fnName (fn) {
  const rx = /^\s*function\s*([^(]*)/i
  const match = rx.exec(fn)
  return match && match[1]
}
function sink (method, fn) {
  if (method === 'fatal') method = 'error'
  const orig = console[method]
  console[method] = function () {
    console[method] = orig
    fn(Array.prototype.slice.call(arguments))
  }
}
