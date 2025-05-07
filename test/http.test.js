'use strict'

const http = require('http')
const os = require('node:os')
const semver = require('semver')
const { test, skip } = require('node:test')
const { sink, once } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()

test('http request support', async t => {
  let originalReq
  const instance = pino(sink((chunk, enc) => {
    t.assert.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.assert.deepStrictEqual(chunk, {
      pid,
      hostname,
      level: 30,
      msg: 'my request',
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers,
        remoteAddress: originalReq.socket.remoteAddress,
        remotePort: originalReq.socket.remotePort
      }
    })
  }))

  const server = http.createServer((req, res) => {
    originalReq = req
    instance.info(req, 'my request')
    res.end('hello')
  })
  server.unref()
  server.listen()
  const err = await once(server, 'listening')
  t.assert.ifError(err)
  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})

test('http request support via serializer', async t => {
  let originalReq
  const instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    t.assert.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.assert.deepStrictEqual(chunk, {
      pid,
      hostname,
      level: 30,
      msg: 'my request',
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers,
        remoteAddress: originalReq.socket.remoteAddress,
        remotePort: originalReq.socket.remotePort
      }
    })
  }))

  const server = http.createServer(function (req, res) {
    originalReq = req
    instance.info({ req }, 'my request')
    res.end('hello')
  })
  server.unref()
  server.listen()
  const err = await once(server, 'listening')
  t.assert.ifError(err)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})

// skipped because request connection is deprecated since v13, and request socket is always available
skip('http request support via serializer without request connection', async t => {
  let originalReq
  const instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    t.assert.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    const expected = {
      pid,
      hostname,
      level: 30,
      msg: 'my request',
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers
      }
    }
    if (semver.gte(process.version, '13.0.0')) {
      expected.req.remoteAddress = originalReq.socket.remoteAddress
      expected.req.remotePort = originalReq.socket.remotePort
    }
    t.assert.deepStrictEqual(chunk, expected)
  }))

  const server = http.createServer(function (req, res) {
    originalReq = req
    delete req.connection
    instance.info({ req }, 'my request')
    res.end('hello')
  })
  server.unref()
  server.listen()
  const err = await once(server, 'listening')
  t.assert.ifError(err)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})

test('http response support', async t => {
  let originalRes
  const instance = pino(sink((chunk, enc) => {
    t.assert.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.assert.deepEqual(chunk, {
      pid,
      hostname,
      level: 30,
      msg: 'my response',
      res: {
        statusCode: originalRes.statusCode,
        headers: originalRes.getHeaders()
      }
    })
  }))

  const server = http.createServer(function (req, res) {
    originalRes = res
    res.end('hello')
    instance.info(res, 'my response')
  })
  server.unref()
  server.listen()
  const err = await once(server, 'listening')

  t.assert.ifError(err)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})

test('http response support via a serializer', async t => {
  const instance = pino({
    serializers: {
      res: pino.stdSerializers.res
    }
  }, sink((chunk, enc) => {
    t.assert.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.assert.deepStrictEqual(chunk, {
      pid,
      hostname,
      level: 30,
      msg: 'my response',
      res: {
        statusCode: 200,
        headers: {
          'x-single': 'y',
          'x-multi': [1, 2]
        }
      }
    })
  }))

  const server = http.createServer(function (req, res) {
    res.setHeader('x-single', 'y')
    res.setHeader('x-multi', [1, 2])
    res.end('hello')
    instance.info({ res }, 'my response')
  })

  server.unref()
  server.listen()
  const err = await once(server, 'listening')
  t.assert.ifError(err)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})

test('http request support via serializer in a child', async t => {
  let originalReq
  const instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    t.assert.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.assert.deepStrictEqual(chunk, {
      pid,
      hostname,
      level: 30,
      msg: 'my request',
      req: {
        method: originalReq.method,
        url: originalReq.url,
        headers: originalReq.headers,
        remoteAddress: originalReq.socket.remoteAddress,
        remotePort: originalReq.socket.remotePort
      }
    })
  }))

  const server = http.createServer(function (req, res) {
    originalReq = req
    const child = instance.child({ req })
    child.info('my request')
    res.end('hello')
  })

  server.unref()
  server.listen()
  const err = await once(server, 'listening')
  t.assert.ifError(err)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})
