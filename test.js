'use strict'

var test = require('tap').test
var pino = require('./')
var writeStream = require('flush-write-stream')
var os = require('os')
var split = require('split2')
var http = require('http')
var spawn = require('child_process').spawn
var pid = process.pid
var hostname = os.hostname()

function sink (func) {
  var result = split(JSON.parse)
  result.pipe(writeStream.obj(func))
  return result
}

function check (t, chunk, level, msg) {
  t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
  delete chunk.time
  t.deepEqual(chunk, {
    pid: pid,
    hostname: hostname,
    level: level,
    msg: msg,
    v: 1
  })
}

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

test('set the level by string', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('set the level by number', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.levelVal = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('set the level by number via string method', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino(sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
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
  var instance = pino({ level: 'error' })
  t.equal(instance.levelVal, 50)
})

test('child returns level integer', function (t) {
  t.plan(1)
  var parent = pino({ level: 'error' })
  var child = parent.child({ foo: 'bar' })
  t.equal(child.levelVal, 50)
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

test('set the level via constructor', function (t) {
  t.plan(4)
  var expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  var instance = pino({ level: 'error' }, sink(function (chunk, enc, cb) {
    var current = expected.shift()
    check(t, chunk, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
  instance.error('this is an error')
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

test('http request support', function (t) {
  t.plan(3)

  var originalReq
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'my request',
      v: 1,
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers,
        remoteAddress: originalReq.connection.remoteAddress,
        remotePort: originalReq.connection.remotePort
      }
    })
    cb()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    instance.info(req, 'my request')
    res.end('hello')
  }).listen(function (err) {
    t.error(err)
    t.teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
})

test('http request support via serializer', function (t) {
  t.plan(3)

  var originalReq
  var instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'my request',
      v: 1,
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers,
        remoteAddress: originalReq.connection.remoteAddress,
        remotePort: originalReq.connection.remotePort
      }
    })
    cb()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    instance.info({ req: req }, 'my request')
    res.end('hello')
  }).listen(function (err) {
    t.error(err)
    t.teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
})

test('http response support', function (t) {
  t.plan(3)

  var originalRes
  var instance = pino(sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'my response',
      v: 1,
      res: {
        statusCode: originalRes.statusCode,
        header: originalRes._header
      }
    })
    cb()
  }))

  var server = http.createServer(function (req, res) {
    originalRes = res
    res.end('hello')
    instance.info(res, 'my response')
  }).listen(function (err) {
    t.error(err)
    t.teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
})

test('http response support via a serializer', function (t) {
  t.plan(3)

  var originalRes
  var instance = pino({
    serializers: {
      res: pino.stdSerializers.res
    }
  }, sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'my response',
      v: 1,
      res: {
        statusCode: originalRes.statusCode,
        header: originalRes._header
      }
    })
    cb()
  }))

  var server = http.createServer(function (req, res) {
    originalRes = res
    res.end('hello')
    instance.info({ res: res }, 'my response')
  }).listen(function (err) {
    t.error(err)
    t.teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
})

test('slowtime', function (t) {
  var instance = pino({slowtime: true},
    sink(function (chunk, enc, cb) {
      t.ok(Date.parse(chunk.time) <= new Date(), 'time is greater than Date.now()')
      t.end()
    }))

  instance.info('hello world')
})

test('http request support via serializer in a child', function (t) {
  t.plan(3)

  var originalReq
  var instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'my request',
      v: 1,
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers,
        remoteAddress: originalReq.connection.remoteAddress,
        remotePort: originalReq.connection.remotePort
      }
    })
    cb()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    var child = instance.child({ req: req })
    child.info('my request')
    res.end('hello')
  }).listen(function (err) {
    t.error(err)
    t.teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
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

test('extreme mode', function (t) {
  var now = Date.now
  var hostname = os.hostname
  var proc = process
  global.process = {
    __proto__: process,
    pid: 123456
  }
  Date.now = function () {
    return 1459875739796
  }
  os.hostname = function () {
    return 'abcdefghijklmnopqr'
  }
  delete require.cache[require.resolve('./')]
  var pino = require('./')
  var expected = ''
  var actual = ''
  var normal = pino(writeStream(function (s, enc, cb) {
    expected += s
    cb()
  }))

  var extreme = pino({extreme: true}, writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  var i = 44
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var e = 'global.process = { __proto__: process,  pid: 123456};Date.now = function () { return 1459875739796;};require("os").hostname = function () { return "abcdefghijklmnopqr";};var pino = require("./");var extreme = pino({extreme: true});extreme.info("h")'

  var child = spawn('node', ['-e', e])
  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual2 += s
    cb()
  }))

  child.on('close', function () {
    t.is(actual, expected)
    t.is(actual2.trim(), expected2)

    t.teardown(function () {
      os.hostname = hostname
      Date.now = now
      global.process = proc
    })

    t.end()
  })
})

test('extreme mode with child', function (t) {
  var now = Date.now
  var hostname = os.hostname
  var proc = process
  global.process = {
    __proto__: process,
    pid: 123456
  }
  Date.now = function () {
    return 1459875739796
  }
  os.hostname = function () {
    return 'abcdefghijklmnopqr'
  }
  delete require.cache[require.resolve('./')]
  var pino = require('./')
  var expected = ''
  var actual = ''
  var normal = pino(writeStream(function (s, enc, cb) {
    expected += s
    cb()
  })).child({ hello: 'world' })

  var extreme = pino({extreme: true}, writeStream(function (s, enc, cb) {
    actual += s
    cb()
  })).child({ hello: 'world' })

  var i = 500
  while (i--) {
    normal.info('h')
    extreme.info('h')
  }

  extreme.flush()

  var expected2 = expected.split('\n')[0]
  var actual2 = ''

  var e = 'global.process = { __proto__: process,  pid: 123456};Date.now = function () { return 1459875739796;};require("os").hostname = function () { return "abcdefghijklmnopqr";};var pino = require("./");var extreme = pino({extreme: true}).child({ hello: "world" });extreme.info("h")'

  var child = spawn('node', ['-e', e])
  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual2 += s
    cb()
  }))

  child.on('close', function () {
    t.is(actual, expected)
    t.is(actual2.trim(), expected2)

    t.teardown(function () {
      os.hostname = hostname
      Date.now = now
      global.process = proc
    })

    t.end()
  })
})

test('pino transform', function (t) {
  t.plan(4)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/.*INFO.*/), 'includes level')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('enable', function (t) {
  var instance = pino({
    level: 'trace',
    enable: false
  }, sink(function (chunk, enc, cb) {
    t.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('silent level', function (t) {
  var instance = pino({
    level: 'silent'
  }, sink(function (chunk, enc, cb) {
    t.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach(function (level) {
    instance[level]('hello world')
  })
  t.end()
})

test('setting level to 100', function (t) {
  var instance = pino({
    level: 100
  }, sink(function (chunk, enc, cb) {
    t.fail('no data should be logged')
  }))

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

test('level-change event', function (t) {
  var instance = pino()
  var handle = function (lvl, val, prevLvl, prevVal) {
    t.is(lvl, 'trace')
    t.is(val, 10)
    t.is(prevLvl, 'info')
    t.is(prevVal, 30)
  }
  instance.on('level-change', handle)
  instance.level = 'trace'
  instance.removeListener('level-change', handle)
  instance.level = 'info'

  var count = 0

  var l1 = function () { count += 1 }
  var l2 = function () { count += 1 }
  var l3 = function () { count += 1 }
  instance.on('level-change', l1)
  instance.on('level-change', l2)
  instance.on('level-change', l3)

  instance.level = 'trace'
  instance.removeListener('level-change', l3)
  instance.level = 'fatal'
  instance.removeListener('level-change', l1)
  instance.level = 'debug'
  instance.removeListener('level-change', l2)
  instance.level = 'info'

  t.is(count, 6)
  t.end()
})
