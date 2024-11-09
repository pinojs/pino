'use strict'

const { describe, test } = require('node:test')
const http = require('node:http')
const os = require('node:os')
const tspl = require('@matteo.collina/tspl')

const { sink, once } = require('./helper')
const pino = require('../')

const { pid } = process
const hostname = os.hostname()

test('http request support', async (t) => {
  const plan = tspl(t, { plan: 3 })
  let originalReq
  const instance = pino(sink((chunk, enc) => {
    plan.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    plan.deepEqual(chunk, {
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
  plan.equal(err, undefined)
  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()

  await plan
})

test('http request support via serializer', async (t) => {
  const plan = tspl(t, { plan: 3 })
  let originalReq
  const instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    plan.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    plan.deepEqual(chunk, {
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
  plan.equal(err, undefined)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()
})

describe('http request support via serializer (avoids stdSerializers)', () => {
  test('current behavior in major-version 9', async (t) => {
    const plan = tspl(t, { plan: 3 })
    let originalReq
    const instance = pino({
      serializers: {
        req: (req) => {
          // original request object is already replaced by pino.stdSerializers.req
          plan.equal(req !== originalReq, true)
          plan.equal(req.arbitraryProperty, undefined)
          return req
        }
      }
    }, sink())

    const server = http.createServer(function (req, res) {
      originalReq = req
      req.arbitraryProperty = Math.random()

      instance.info(req, 'my response')
      res.end('hello')
    })

    server.unref()
    server.listen()
    const err = await once(server, 'listening')
    plan.equal(err, undefined)

    const res = await once(http.get('http://localhost:' + server.address().port), 'response')
    res.resume()
    server.close()
  })

  test('future behavior', async (t) => {
    const plan = tspl(t, { plan: 3 })
    const resultOfSerialization = Math.random()
    let originalReq
    const instance = pino({
      requestKey: 'myRequest',
      serializers: {
        req: (req) => {
          plan.equal(req, originalReq)
          plan.equal(req.arbitraryProperty, originalReq.arbitraryProperty)
          return resultOfSerialization
        }
      },
      future: {
        skipUnconditionalStdSerializers: true
      }
    }, sink((chunk, _enc) => {
      match(chunk, {
        pid,
        hostname,
        level: 30,
        msg: 'my request',
        myRequest: resultOfSerialization
      })
    }))

    const server = http.createServer(function (req, res) {
      originalReq = req
      req.arbitraryProperty = Math.random()

      instance.info(req, 'my request')
      res.end('hello')
    })
    server.unref()
    server.listen()
    const err = await once(server, 'listening')
    plan.equal(err, undefined)

    const res = await once(http.get('http://localhost:' + server.address().port), 'response')
    res.resume()
    server.close()
  })
})

test('http response support', async (t) => {
  const plan = tspl(t, { plan: 3 })
  let originalRes
  const instance = pino(sink((chunk, enc) => {
    plan.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    plan.deepEqual(chunk, {
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

  plan.equal(err, undefined)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()

  await plan
})

test('http response support via a serializer', async (t) => {
  const plan = tspl(t, { plan: 3 })
  const instance = pino({
    serializers: {
      res: pino.stdSerializers.res
    }
  }, sink((chunk, enc) => {
    plan.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    plan.deepEqual(chunk, {
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
  plan.equal(err, undefined)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()

  await plan
})

describe('http response support via serializer (avoids stdSerializers)', () => {
  test('current behavior in major-version 9', async (t) => {
    const plan = tspl(t, { plan: 3 })
    let originalRes
    const instance = pino({
      serializers: {
        res: (res) => {
          // original response object is already replaced by pino.stdSerializers.res
          plan.equal(res !== originalRes, true)
          plan.equal(res.arbitraryProperty, undefined)
          return res
        }
      }
    }, sink())

    const server = http.createServer(function (_req, res) {
      originalRes = res
      res.arbitraryProperty = Math.random()

      instance.info(res, 'my response')
      res.end('hello')
    })

    server.unref()
    server.listen()
    const err = await once(server, 'listening')
    plan.equal(err, undefined)

    const res = await once(http.get('http://localhost:' + server.address().port), 'response')
    res.resume()
    server.close()

    await plan
  })

  test('future behavior', async (t) => {
    const plan = tspl(t, { plan: 3 })
    const resultOfSerialization = Math.random()
    let originalRes
    const instance = pino({
      responseKey: 'myResponseKey',
      serializers: {
        res: (res) => {
          plan.equal(res, originalRes)
          plan.equal(res.arbitraryProperty, originalRes.arbitraryProperty)
          return resultOfSerialization
        }
      },
      future: {
        skipUnconditionalStdSerializers: true
      }
    }, sink((chunk, _enc) => {
      match(chunk, {
        pid,
        hostname,
        level: 30,
        msg: 'my response',
        myResponseKey: resultOfSerialization
      })
    }))

    const server = http.createServer(function (_req, res) {
      originalRes = res
      res.arbitraryProperty = Math.random()

      instance.info(res, 'my response')
      res.end('hello')
    })

    server.unref()
    server.listen()
    const err = await once(server, 'listening')
    plan.equal(err, undefined)

    const res = await once(http.get('http://localhost:' + server.address().port), 'response')
    res.resume()
    server.close()
  })
})

test('http request support via serializer in a child', async (t) => {
  const plan = tspl(t, { plan: 3 })
  let originalReq
  const instance = pino({
    serializers: {
      req: pino.stdSerializers.req
    }
  }, sink((chunk, enc) => {
    plan.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    plan.deepEqual(chunk, {
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
  plan.equal(err, undefined)

  const res = await once(http.get('http://localhost:' + server.address().port), 'response')
  res.resume()
  server.close()

  await plan
})
