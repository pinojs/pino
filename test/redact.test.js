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

test('redact.paths option – throws if not array', function (t) {
  t.throws(() => {
    pino({redact: {paths: 'req.headers.cookie'}})
  })
  t.end()
})

test('redact.paths option – throws if array does not only contain strings', function (t) {
  t.throws(() => {
    pino({redact: {paths: ['req.headers.cookie', {}]}})
  })
  t.end()
})

test('redact.paths option – throws if array contains an invalid path', function (t) {
  t.throws(() => {
    pino({redact: {paths: ['req,headers.cookie']}})
  })
  t.end()
})

test('redact.censor option – throws if censor is a function', function (t) {
  t.throws(() => {
    pino({redact: {paths: ['req.headers.cookie'], censor: () => {}}})
  })
  t.end()
})

test('redact option – top level key', function (t) {
  var instance = pino({redact: ['key']}, sink(function (o, enc, cb) {
    t.equals(o.key, '[Redacted]')
    t.end()
  }))
  instance.info({
    key: {redact: 'me'}
  })
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

test('redact.paths option – object', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc, cb) {
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

test('redact.paths option – child object', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc, cb) {
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

test('redact.paths option – interpolated object', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc, cb) {
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

test('redact.censor option – sets the redact value', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie'], censor: 'test'}}, sink(function (o, enc, cb) {
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

test('redact.remove option – removes both key and value', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie'], remove: true}}, sink(function (o, enc, cb) {
    t.equals('cookie' in o.req.headers, false)
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

test('redact.remove – top level key', function (t) {
  var instance = pino({redact: {paths: ['key'], remove: true}}, sink(function (o, enc, cb) {
    t.equals('key' in o, false)
    t.end()
  }))
  instance.info({
    key: {redact: 'me'}
  })
})

test('redact.paths preserves original object values after the log write', function (t) {
  var instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, '[Redacted]')
    t.equals(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
    t.end()
  }))
  const obj = {
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
  }
  instance.info(obj)
})

test('redact.paths preserves original object values after the log write', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, '[Redacted]')
    t.equals(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
    t.end()
  }))
  const obj = {
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
  }
  instance.info(obj)
})

test('redact.censor preserves original object values after the log write', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie'], censor: 'test'}}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, 'test')
    t.equals(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
    t.end()
  }))
  const obj = {
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
  }
  instance.info(obj)
})

test('redact.remove preserves original object values after the log write', function (t) {
  var instance = pino({redact: {paths: ['req.headers.cookie'], remove: true}}, sink(function (o, enc, cb) {
    t.equals('cookie' in o.req.headers, false)
    t.equals('cookie' in obj.req.headers, true)
    t.end()
  }))
  const obj = {
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
  }
  instance.info(obj)
})

test('redact – supports last position wildcard paths', function (t) {
  var instance = pino({redact: ['req.headers.*']}, sink(function (o, enc, cb) {
    t.equals(o.req.headers.cookie, '[Redacted]')
    t.equals(o.req.headers.host, '[Redacted]')
    t.equals(o.req.headers.connection, '[Redacted]')
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

test('redact – supports intermediate wildcard paths', function (t) {
  var instance = pino({redact: ['req.*.cookie']}, sink(function (o, enc, cb) {
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
