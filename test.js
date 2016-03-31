'use strict'

var test = require('tap').test
var pino = require('./')
var writeStream = require('flush-write-stream')
var os = require('os')
var split = require('split2')
var http = require('http')
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

test('set the level', function (t) {
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
