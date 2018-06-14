'use strict'

var test = require('tap').test
var os = require('os')
var proxyquire = require('proxyquire')
var pino = require('../')
var sink = require('./helper').sink
var check = require('./helper').check

var pid = process.pid
var hostname = os.hostname()

test('pino version is exposed', ({end, ok, is}) => {
  var instance = pino()
  ok(instance.pino)
  is(instance.pino, require('../package.json').version)
  end()
})

test('child exposes pino version', ({end, ok}) => {
  var child = pino().child({foo: 'bar'})
  ok(child.pino)
  end()
})

function levelTest (name, level) {
  test(name + ' logs as ' + level, ({end, is}) => {
    var instance = pino(sink((chunk, enc, cb) => {
      check(is, chunk, level, 'hello world')
      end()
      cb()
    }))

    instance.level = name
    instance[name]('hello world')
  })

  test('passing objects at level ' + name, ({end, ok, same}) => {
    var instance = pino(sink((chunk, enc) => {
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

  test('passing an object and a string at level ' + name, ({end, ok, same}) => {
    var instance = pino(sink((chunk, enc) => {
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

  test('formatting logs as ' + name, ({end, is}) => {
    var instance = pino(sink((chunk, enc) => {
      check(is, chunk, level, 'hello 42')
      end()
    }))

    instance.level = name
    instance[name]('hello %d', 42)
  })

  test('passing error with a serializer at level ' + name, ({end, ok, same}) => {
    var err = new Error('myerror')
    var instance = pino({
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

  test('child logger for level ' + name, ({end, ok, same}) => {
    var instance = pino(sink((chunk, enc) => {
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
    var child = instance.child({
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
  var instance = pino({
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
  var instance = pino(sink(() => {}))
  var b = {}
  var a = {
    hello: b
  }
  b.a = a // circular ref
  instance.info(a)
  end()
})

test('explode with a circular ref with safe = false', ({end, throws}) => {
  var instance = pino({ safe: false }, sink())
  var b = {}
  var a = {
    hello: b
  }
  b.a = a // circular ref
  throws(() => instance.info(a))
  end()
})

test('set the name', ({end, ok, same}) => {
  var instance = pino({
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
  var message = 'hello world'
  var messageKey = 'fooMessage'
  var instance = pino({
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
  var instance = pino(sink((chunk, enc) => {
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
  var instance = pino(sink(({hello, time}, enc) => {
    ok(new Date(time) <= new Date(), 'time is greater than Date.now()')
    is(hello, undefined)
    end()
  }))

  instance.info(Object.create({hello: 'world'}))
})

test('set the base', ({end, ok, same}) => {
  var instance = pino({
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
  var instance = pino({
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
  var instance = pino(sink())
  throws(() => instance.child())
  end()
})

test('correctly escapes msg strings with stray double quote at end', ({end, same}) => {
  var instance = pino({
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
  var instance = pino({
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
  var instance = pino(sink((chunk, enc) => {
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
  var instance = pino(sink((chunk, enc) => {
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
  var instance = pino({
    test: 'this'
  }, sink((obj, enc) => {
    is('test' in obj, false)
    end()
  }))

  instance.fatal({test: {toJSON () { return undefined }}})
})

test('correctly supports stderr', ({end, same}) => {
  // stderr inherits from Stream, rather than Writable
  var dest = {
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

  var instance = pino(dest)

  instance.fatal('a message')
  end()
})

test('normalize number to string', ({end, same}) => {
  var instance = pino(sink((chunk, enc) => {
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
  var instance = pino(sink((chunk, enc) => {
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
  var instance = pino(sink((chunk, enc) => {
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
  var o = Object.create(null)
  o.test = 'test'
  instance.info(o)
})

// https://github.com/pinojs/pino/issues/222
test('children with same names render in correct order', ({end, is}) => {
  var root = pino(sink(({a}, enc) => {
    is(a, 3, 'last logged object takes precedence')
    end()
  }))

  root.child({a: 1}).child({a: 2}).info({a: 3})
})

// https://github.com/pinojs/pino/pull/251 - use this.stringify
test('when safe is true it should ONLY use `fast-safe-stringify`', ({end, is}) => {
  var safeStates = [true, false]
  var isFastSafeStringifyCalled = null
  var mockedPino = proxyquire('../', {
    'fast-safe-stringify' () {
      isFastSafeStringifyCalled = true
      return '{ "hello": "world" }'
    }
  })
  safeStates.forEach((safeState) => {
    isFastSafeStringifyCalled = false
    var instance = mockedPino({ safe: safeState }, sink())
    instance.info({ hello: 'world' })
    is(isFastSafeStringifyCalled, safeState)
  })
  end()
})
