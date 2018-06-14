'use strict'
const os = require('os')
const { test } = require('tap')
const { sink, check } = require('./helper')
const proxyquire = require('proxyquire')
const pino = require('../')
const { version } = require('../package.json')
const { pid } = process
const hostname = os.hostname()

test('pino version is exposed', ({end, is}) => {
  const instance = pino()
  is(instance.pino, version)
  end()
})

test('child exposes pino version', ({end, is}) => {
  const child = pino().child({foo: 'bar'})
  is(child.pino, version)
  end()
})

function levelTest (name, level) {
  test(`${name} logs as ${level}`, ({end, is}) => {
    const instance = pino(sink((chunk, enc, cb) => {
      check(is, chunk, level, 'hello world')
      end()
    }))

    instance.level = name
    instance[name]('hello world')
  })

  test(`passing objects at level ${name}`, ({end, ok, same}) => {
    const instance = pino(sink((chunk, enc) => {
      ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      same(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        hello: 'world',
        v: 1
      })
      end()
    }))

    instance.level = name
    instance[name]({ hello: 'world' })
  })

  test(`passing an object and a string at level ${name}`, ({end, ok, same}) => {
    const instance = pino(sink((chunk, enc) => {
      ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      same(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        msg: 'a string',
        hello: 'world',
        v: 1
      })
      end()
    }))

    instance.level = name
    instance[name]({ hello: 'world' }, 'a string')
  })

  test(`formatting logs as ${name}`, ({end, is}) => {
    const instance = pino(sink((chunk, enc) => {
      check(is, chunk, level, 'hello 42')
      end()
    }))

    instance.level = name
    instance[name]('hello %d', 42)
  })

  test(`passing error with a serializer at level ${name}`, ({end, ok, same}) => {
    const err = new Error('myerror')
    const instance = pino({
      serializers: {
        err: pino.stdSerializers.err
      }
    }, sink((chunk, enc) => {
      ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      same(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        err: {
          type: 'Error',
          message: err.message,
          stack: err.stack
        },
        v: 1
      })
      end()
    }))

    instance.level = name
    instance[name]({ err: err })
  })

  test(`child logger for level ${name}`, ({end, ok, same}) => {
    const instance = pino(sink((chunk, enc) => {
      ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      same(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        msg: 'hello world',
        hello: 'world',
        v: 1
      })
      end()
    }))

    instance.level = name
    const child = instance.child({
      hello: 'world'
    })
    child[name]('hello world')
  })
}

levelTest('fatal', 60)
levelTest('error', 50)
levelTest('warn', 40)
levelTest('info', 30)
levelTest('debug', 20)
levelTest('trace', 10)

test('serializers can return undefined to strip field', ({end, is}) => {
  const instance = pino({
    serializers: {
      test () { return undefined }
    }
  }, sink((obj, enc) => {
    is('test' in obj, false)
    end()
  }))

  instance.info({ test: 'sensitive info' })
})

test('does not explode with a circular ref', ({end}) => {
  const instance = pino(sink())
  const b = {}
  const a = {
    hello: b
  }
  b.a = a // circular ref
  instance.info(a)
  end()
})

test('explode with a circular ref with safe is false', ({end, throws}) => {
  const instance = pino({ safe: false }, sink())
  const b = {}
  const a = {
    hello: b
  }
  b.a = a // circular ref
  throws(() => instance.info(a))
  end()
})

test('set the name', ({end, ok, same}) => {
  const instance = pino({
    name: 'hello'
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 60,
      name: 'hello',
      msg: 'this is fatal',
      v: 1
    })
    end()
  }))

  instance.fatal('this is fatal')
})

test('set the messageKey', ({end, ok, same}) => {
  const message = 'hello world'
  const messageKey = 'fooMessage'
  const instance = pino({
    messageKey
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      fooMessage: message,
      v: 1
    })
    end()
  }))

  instance.info(message)
})

test('set undefined properties', ({end, ok, same}) => {
  const instance = pino(sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      v: 1
    })
    end()
  }))

  instance.info({ hello: 'world', property: undefined })
})

test('prototype properties are not logged', ({end, ok, is}) => {
  const instance = pino(sink(({hello, time}, enc) => {
    ok(new Date(time) <= new Date(), 'time is greater than Date.now()')
    is(hello, undefined)
    end()
  }))

  instance.info(Object.create({hello: 'world'}))
})

test('set the base', ({end, ok, same}) => {
  const instance = pino({
    base: {
      a: 'b'
    }
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      a: 'b',
      level: 60,
      msg: 'this is fatal',
      v: 1
    })
    end()
  }))

  instance.fatal('this is fatal')
})

test('set the base to null', ({end, ok, same}) => {
  const instance = pino({
    base: null
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      level: 60,
      msg: 'this is fatal',
      v: 1
    })
    end()
  }))

  instance.fatal('this is fatal')
})

test('throw if creating child without bindings', ({end, throws}) => {
  const instance = pino(sink())
  throws(() => instance.child())
  end()
})

test('correctly escapes msg strings with stray double quote at end', ({end, same}) => {
  const instance = pino({
    name: 'hello'
  }, sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 60,
      name: 'hello',
      msg: 'this contains "',
      v: 1
    })
    end()
  }))

  instance.fatal('this contains "')
})

test('correctly escape msg strings with unclosed double quote', ({end, same}) => {
  const instance = pino({
    name: 'hello'
  }, sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 60,
      name: 'hello',
      msg: '" this contains',
      v: 1
    })
    end()
  }))

  instance.fatal('" this contains')
})

// https://github.com/pinojs/pino/issues/139
test('object and format string', ({end, same}) => {
  const instance = pino(sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'foo bar',
      v: 1
    })
    end()
  }))

  instance.info({}, 'foo %s', 'bar')
})

test('object and format string property', ({end, same}) => {
  const instance = pino(sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'foo bar',
      answer: 42,
      v: 1
    })
    end()
  }))

  instance.info({ answer: 42 }, 'foo %s', 'bar')
})

test('correctly strip undefined when returned from toJSON', ({end, is}) => {
  const instance = pino({
    test: 'this'
  }, sink((obj, enc) => {
    is('test' in obj, false)
    end()
  }))

  instance.fatal({test: {toJSON () { return undefined }}})
})

test('correctly supports stderr', ({end, same}) => {
  // stderr inherits from Stream, rather than Writable
  const dest = {
    writable: true,
    write (chunk) {
      chunk = JSON.parse(chunk)
      delete chunk.time
      same(chunk, {
        pid: pid,
        hostname: hostname,
        level: 60,
        msg: 'a message',
        v: 1
      })
    }
  }

  const instance = pino(dest)

  instance.fatal('a message')
  end()
})

test('normalize number to string', ({end, same}) => {
  const instance = pino(sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: '1',
      v: 1
    })
    end()
  }))

  instance.info(1)
})

test('normalize number to string with an object', ({end, same}) => {
  const instance = pino(sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: '1',
      answer: 42,
      v: 1
    })
    end()
  }))

  instance.info({ answer: 42 }, 1)
})

test('handles objects with null prototype', ({end, same}) => {
  const instance = pino(sink((chunk, enc) => {
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      test: 'test',
      v: 1
    })
    end()
  }))
  const o = Object.create(null)
  o.test = 'test'
  instance.info(o)
})

// https://github.com/pinojs/pino/issues/222
test('children with same names render in correct order', ({end, is}) => {
  const root = pino(sink(({a}, enc) => {
    is(a, 3, 'last logged object takes precedence')
    end()
  }))

  root.child({a: 1}).child({a: 2}).info({a: 3})
})

// https://github.com/pinojs/pino/pull/251 - use this.stringify
test('when safe is true it should ONLY use `fast-safe-stringify`', ({end, is}) => {
  var isFastSafeStringifyCalled = false
  const mockedPino = proxyquire('../', {
    'fast-safe-stringify' () {
      isFastSafeStringifyCalled = true
      return '{ "hello": "world" }'
    }
  })
  const instance = mockedPino({ safe: true }, sink())
  instance.info({ hello: 'world' })
  is(isFastSafeStringifyCalled, true)
  end()
})
