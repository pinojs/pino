'use strict'

var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

test('redact option – throws if not array', function (t) {
  t.throws(() => {
    pino({redact: 'req.headers.cookie'})
  })
  t.end()
})

test('redact option – throws if array does not only contain strings', function (t) {
  t.throws(() => {
    pino({redact: ['req.headers.cookie', {}]})
  })
  t.end()
})

test('redact option – throws if array contains an invalid path', function (t) {
  t.throws(() => {
    pino({redact: ['req,headers.cookie']})
  })
  t.end()
})

test('censor option – throws if censor is a function', function (t) {
  t.throws(() => {
    pino({redact: ['req.headers.cookie'], censor: () => {}})
  })
  t.end()
})

test('redact option – object', function (t) {
  var instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, '[Redacted]')
    t.end()
  }))
  instance.info({
    req: {
      id: 7915,
      method: 'GET',
      url: '/',
      headers: {
        host: 'localhost:3000',
        connection: 'keep-alive',
        cookie: 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;'
      },
      remoteAddress: '::ffff:127.0.0.1',
      remotePort: 58022
    }
  })
})

test('redact option – child object', function (t) {
  var instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, '[Redacted]')
    t.end()
  }))

  instance.child({
    req: {
      id: 7915,
      method: 'GET',
      url: '/',
      headers: {
        host: 'localhost:3000',
        connection: 'keep-alive',
        cookie: 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;'
      },
      remoteAddress: '::ffff:127.0.0.1',
      remotePort: 58022
    }
  }).info('message completed')
})

test('redact option – interpolated object', function (t) {
  var instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc, cb) {
    t.equals(JSON.parse(o.msg.replace(/test /, '')).req.headers.cookie, '[Redacted]')
    t.end()
  }))

  instance.info('test', {
    req: {
      id: 7915,
      method: 'GET',
      url: '/',
      headers: {
        host: 'localhost:3000',
        connection: 'keep-alive',
        cookie: 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;'
      },
      remoteAddress: '::ffff:127.0.0.1',
      remotePort: 58022
    }
  })
})

test('censor option – sets the redact value', function (t) {
  var instance = pino({redact: ['req.headers.cookie'], censor: 'test'}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, 'test')
    t.end()
  }))
  instance.info({
    req: {
      id: 7915,
      method: 'GET',
      url: '/',
      headers: {
        host: 'localhost:3000',
        connection: 'keep-alive',
        cookie: 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;'
      },
      remoteAddress: '::ffff:127.0.0.1',
      remotePort: 58022
    }
  })
})
