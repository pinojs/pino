'use strict'

const http = require('http')
const os = require('os')
const { test } = require('tap')
const { sink } = require('./helper')
const pino = require('../')

var pid = process.pid
var hostname = os.hostname()

test('http request support', ({end, ok, same, error, teardown}) => {
  var originalReq
  var instance = pino(sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    end()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    instance.info(req, 'my request')
    res.end('hello')
  }).listen(function (err) {
    error(err)
    teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
  server.unref()
})

test('http request support via serializer', ({end, ok, same, error, teardown}) => {
  var originalReq
  var instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    end()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    instance.info({ req: req }, 'my request')
    res.end('hello')
  }).listen(function (err) {
    error(err)
    teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
  server.unref()
})

test('http request support via serializer without request connection', ({end, ok, same, error, teardown}) => {
  var originalReq
  var instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    end()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    delete req.connection
    instance.info({ req: req }, 'my request')
    res.end('hello')
  }).listen(function (err) {
    error(err)
    teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
  server.unref()
})

test('http response support', ({end, ok, same, error, teardown}) => {
  var originalRes
  var instance = pino(sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    end()
  }))

  var server = http.createServer(function (req, res) {
    originalRes = res
    res.end('hello')
    instance.info(res, 'my response')
  }).listen(function (err) {
    error(err)
    teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
  server.unref()
})

test('http response support via a serializer', ({end, ok, same, error, teardown}) => {
  var originalRes
  var instance = pino({
    serializers: {
      res: pino.stdSerializers.res
    }
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    end()
  }))

  var server = http.createServer(function (req, res) {
    originalRes = res
    res.end('hello')
    instance.info({ res: res }, 'my response')
  }).listen(function (err) {
    error(err)
    teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
  server.unref()
})

test('http request support via serializer in a child', ({end, ok, same, error, teardown}) => {
  var originalReq
  var instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    end()
  }))

  var server = http.createServer(function (req, res) {
    originalReq = req
    var child = instance.child({ req: req })
    child.info('my request')
    res.end('hello')
  }).listen(function (err) {
    error(err)
    teardown(server.close.bind(server))

    http.get('http://localhost:' + server.address().port, function (res) {
      res.resume()
    })
  })
  server.unref()
})
