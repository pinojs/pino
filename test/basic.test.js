'use strict'

var test = require('tap').test
var os = require('os')
var pino = require('../')
var sink = require('./helper').sink
var check = require('./helper').check

var pid = process.pid
var hostname = os.hostname()

function levelTest (name, level) {
  test(name + ' logs as ' + level, function (t) {
    t.plan(2)
    var instance = pino(sink(function (chunk, enc, cb) {
      check(t, chunk, level, 'hello world')
    }))

    instance.level = name
    instance[name]('hello world')
  })

  test('passing objects at level ' + name, function (t) {
    t.plan(2)
    var instance = pino(sink(function (chunk, enc, cb) {
      t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      t.deepEqual(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        hello: 'world',
        v: 1
      })
    }))

    instance.level = name
    instance[name]({ hello: 'world' })
  })

  test('passing an object and a string at level ' + name, function (t) {
    t.plan(2)
    var instance = pino(sink(function (chunk, enc, cb) {
      t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      t.deepEqual(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        msg: 'a string',
        hello: 'world',
        v: 1
      })
    }))

    instance.level = name
    instance[name]({ hello: 'world' }, 'a string')
  })

  test('formatting logs as ' + name, function (t) {
    t.plan(2)
    var instance = pino(sink(function (chunk, enc, cb) {
      check(t, chunk, level, 'hello 42')
    }))

    instance.level = name
    instance[name]('hello %d', 42)
  })

  test('passing error at level ' + name, function (t) {
    t.plan(2)
    var err = new Error('myerror')
    var instance = pino(sink(function (chunk, enc, cb) {
      t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      t.deepEqual(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        type: 'Error',
        msg: err.message,
        stack: err.stack,
        v: 1
      })
      cb()
    }))

    instance.level = name
    instance[name](err)
  })

  test('passing error with a serializer at level ' + name, function (t) {
    t.plan(2)
    var err = new Error('myerror')
    var instance = pino({
      serializers: {
        err: pino.stdSerializers.err
      }
    }, sink(function (chunk, enc, cb) {
      t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      t.deepEqual(chunk, {
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
      cb()
    }))

    instance.level = name
    instance[name]({ err: err })
  })

  test('child logger for level ' + name, function (t) {
    t.plan(2)
    var instance = pino(sink(function (chunk, enc, cb) {
      t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
      delete chunk.time
      t.deepEqual(chunk, {
        pid: pid,
        hostname: hostname,
        level: level,
        msg: 'hello world',
        hello: 'world',
        v: 1
      })
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

test('serializers can return undefined to strip field', function (t) {
  t.plan(1)
  var instance = pino({
    serializers: {
      test: function (o) { return undefined }
    }
  }, sink(function (obj, enc, cb) {
    t.notOk('test' in obj)
    cb()
  }))

  instance.info({ test: 'sensitive info' })
})

test('does not explode with a circular ref', function (t) {
  var instance = pino(sink(function (chunk, enc, cb) {
    // nothing to check
    cb()
  }))
  var b = {}
  var a = {
    hello: b
  }
  b.a = a // circular ref
  instance.info(a)
  t.end()
})

test('explode with a circular ref with safe = false', function (t) {
  var instance = pino({ safe: false }, sink(function (chunk, enc, cb) {
    // nothing to check
    cb()
  }))
  var b = {}
  var a = {
    hello: b
  }
  b.a = a // circular ref
  t.throws(function () {
    instance.info(a)
  })
  t.end()
})

test('set the name', function (t) {
  t.plan(2)

  var instance = pino({
    name: 'hello'
  }, sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 60,
      name: 'hello',
      msg: 'this is fatal',
      v: 1
    })
    cb()
  }))

  instance.fatal('this is fatal')
})

test('set undefined properties', function (t) {
  t.plan(2)

  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      v: 1
    })
    cb()
  }))

  instance.info({ hello: 'world', property: undefined })
})

test('set properties defined in the prototype chain', function (t) {
  t.plan(2)

  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      v: 1
    })
    cb()
  }))

  function MyObject () {
    this.hello = 'world'
  }

  MyObject.prototype.some = function () {}

  instance.info(new MyObject())
})

test('throw if creating child without bindings', function (t) {
  t.plan(1)

  var instance = pino(
    sink(function (chunk, enc, cb) {
      t.ok(Date.parse(chunk.time) <= new Date(), 'time is greater than Date.now()')
      t.end()
    }))

  t.throws(function () {
    instance.child()
  })
})

test('correctly escape msg strings', function (t) {
  // These characters must be escaped according to the JSON spec
  // Reference: https://tools.ietf.org/html/rfc7159#section-7
  var mustEscape = [
    '\u0000', // NUL  Null character
    '\u0001', // SOH  Start of Heading
    '\u0002', // STX  Start of Text
    '\u0003', // ETX  End-of-text character
    '\u0004', // EOT  End-of-transmission character
    '\u0005', // ENQ  Enquiry character
    '\u0006', // ACK  Acknowledge character
    '\u0007', // BEL  Bell character
    '\u0008', // BS   Backspace
    '\u0009', // HT   Horizontal tab
    '\u000A', // LF   Line feed
    '\u000B', // VT   Vertical tab
    '\u000C', // FF   Form feed
    '\u000D', // CR   Carriage return
    '\u000E', // SO   Shift Out
    '\u000F', // SI   Shift In
    '\u0010', // DLE  Data Link Escape
    '\u0011', // DC1  Device Control 1
    '\u0012', // DC2  Device Control 2
    '\u0013', // DC3  Device Control 3
    '\u0014', // DC4  Device Control 4
    '\u0015', // NAK  Negative-acknowledge character
    '\u0016', // SYN  Synchronous Idle
    '\u0017', // ETB  End of Transmission Block
    '\u0018', // CAN  Cancel character
    '\u0019', // EM   End of Medium
    '\u001A', // SUB  Substitute character
    '\u001B', // ESC  Escape character
    '\u001C', // FS   File Separator
    '\u001D', // GS   Group Separator
    '\u001E', // RS   Record Separator
    '\u001F', // US   Unit Separator
    '\u0022', // "    Quotation mark
    '\u005C'  // \    Reverse solidus
  ]

  t.plan(mustEscape.length)

  mustEscape.forEach(function (character) {
    var instance = pino({
      name: 'hello'
    }, sink(function (chunk, enc, cb) {
      delete chunk.time
      t.deepEqual(chunk, {
        pid: pid,
        hostname: hostname,
        level: 60,
        name: 'hello',
        msg: 'this contains ' + character,
        v: 1
      })
      cb()
    }))

    instance.fatal('this contains ' + character)
  })
})

test('correctly strip undefined when returned from toJSON', function (t) {
  t.plan(1)

  var instance = pino({
    test: 'this'
  }, sink(function (obj, enc, cb) {
    t.notOk('test' in obj)
    cb()
  }))

  instance.fatal({test: {toJSON: function () { return undefined }}})
})

test('correctly support node v4+ stderr', function (t) {
  t.plan(1)

  // stderr inherits from Stream, rather than Writable
  var dest = {
    writable: true,
    write: function (chunk) {
      chunk = JSON.parse(chunk)
      delete chunk.time
      t.deepEqual(chunk, {
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
})
