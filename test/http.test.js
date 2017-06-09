'use strict'

var test = require('tap').test
var os = require('os')
var pino = require('../')
var sink = require('./helper').sink
var http = require('http')
var time = require('../lib/time')

var pid = process.pid
var hostname = os.hostname()

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

test('http request support via serializer without request connection', function (t) {
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
        headers: originalReq.headers
      }
    })
    cb()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    delete req.connection
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
  var instance = pino({timestamp: time.slowTime},
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
