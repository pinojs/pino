'use strict'

const { test } = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

test('redact option – throws if not array', async ({ throws }) => {
  throws(() => {
    pino({ redact: 'req.headers.cookie' })
  })
})

test('redact option – throws if array does not only contain strings', async ({ throws }) => {
  throws(() => {
    pino({ redact: ['req.headers.cookie', {}] })
  })
})

test('redact option – throws if array contains an invalid path', async ({ throws }) => {
  throws(() => {
    pino({ redact: ['req,headers.cookie'] })
  })
})

test('redact.paths option – throws if not array', async ({ throws }) => {
  throws(() => {
    pino({ redact: { paths: 'req.headers.cookie' } })
  })
})

test('redact.paths option – throws if array does not only contain strings', async ({ throws }) => {
  throws(() => {
    pino({ redact: { paths: ['req.headers.cookie', {}] } })
  })
})

test('redact.paths option – throws if array contains an invalid path', async ({ throws }) => {
  throws(() => {
    pino({ redact: { paths: ['req,headers.cookie'] } })
  })
})

test('redact option – top level key', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['key'] }, stream)
  instance.info({
    key: { redact: 'me' }
  })
  const { key } = await once(stream, 'data')
  is(key, '[Redacted]')
})

test('redact option – top level key next level key', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['key', 'key.foo'] }, stream)
  instance.info({
    key: { redact: 'me' }
  })
  const { key } = await once(stream, 'data')
  is(key, '[Redacted]')
})

test('redact option – next level key then top level key', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['key.foo', 'key'] }, stream)
  instance.info({
    key: { redact: 'me' }
  })
  const { key } = await once(stream, 'data')
  is(key, '[Redacted]')
})

test('redact option – object', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.headers.cookie'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('redact option – child object', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.headers.cookie'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('redact option – interpolated object', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.headers.cookie'] }, stream)

  instance.info('test %j', {
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
  const { msg } = await once(stream, 'data')
  is(JSON.parse(msg.replace(/test /, '')).req.headers.cookie, '[Redacted]')
})

test('redact.paths option – object', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'] } }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('redact.paths option – child object', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'] } }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('redact.paths option – interpolated object', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'] } }, stream)

  instance.info('test %j', {
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
  const { msg } = await once(stream, 'data')
  is(JSON.parse(msg.replace(/test /, '')).req.headers.cookie, '[Redacted]')
})

test('redact.censor option – sets the redact value', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'], censor: 'test' } }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, 'test')
})

test('redact.remove option – removes both key and value', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'], remove: true } }, stream)
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
  const { req } = await once(stream, 'data')
  is('cookie' in req.headers, false)
})

test('redact.remove – top level key - object value', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['key'], remove: true } }, stream)
  instance.info({
    key: { redact: 'me' }
  })
  const o = await once(stream, 'data')
  is('key' in o, false)
})

test('redact.remove – top level key - number value', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['key'], remove: true } }, stream)
  instance.info({
    key: 1
  })
  const o = await once(stream, 'data')
  is('key' in o, false)
})

test('redact.remove – top level key - boolean value', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['key'], remove: true } }, stream)
  instance.info({
    key: false
  })
  const o = await once(stream, 'data')
  is('key' in o, false)
})

test('redact.remove – top level key in child logger', async ({ is }) => {
  const stream = sink()
  const opts = { redact: { paths: ['key'], remove: true } }
  const instance = pino(opts, stream).child({ key: { redact: 'me' } })
  instance.info('test')
  const o = await once(stream, 'data')
  is('key' in o, false)
})

test('redact.paths preserves original object values after the log write', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.headers.cookie'] }, stream)
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
  const o = await once(stream, 'data')
  is(o.req.headers.cookie, '[Redacted]')
  is(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
})

test('redact.paths preserves original object values after the log write', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'] } }, stream)
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
  const o = await once(stream, 'data')
  is(o.req.headers.cookie, '[Redacted]')
  is(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
})

test('redact.censor preserves original object values after the log write', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'], censor: 'test' } }, stream)
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
  const o = await once(stream, 'data')
  is(o.req.headers.cookie, 'test')
  is(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
})

test('redact.remove preserves original object values after the log write', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: { paths: ['req.headers.cookie'], remove: true } }, stream)
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
  const o = await once(stream, 'data')
  is('cookie' in o.req.headers, false)
  is('cookie' in obj.req.headers, true)
})

test('redact – supports last position wildcard paths', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.headers.*'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
  is(req.headers.host, '[Redacted]')
  is(req.headers.connection, '[Redacted]')
})

test('redact – supports first position wildcard paths', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['*.headers'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers, '[Redacted]')
})

test('redact – supports first position wildcards before other paths', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['*.headers.cookie', 'req.id'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
  is(req.id, '[Redacted]')
})

test('redact – supports first position wildcards after other paths', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.id', '*.headers.cookie'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
  is(req.id, '[Redacted]')
})

test('redact – supports first position wildcards after top level keys', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['key', '*.headers.cookie'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('redact – supports top level wildcard', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['*'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req, '[Redacted]')
})

test('redact – supports top level wildcard with a censor function', async ({ is }) => {
  const stream = sink()
  const instance = pino({
    redact: {
      paths: ['*'],
      censor: () => '[Redacted]'
    }
  }, stream)
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
  const { req } = await once(stream, 'data')
  is(req, '[Redacted]')
})

test('redact – supports top level wildcard and leading wildcard', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['*', '*.req'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req, '[Redacted]')
})

test('redact – supports intermediate wildcard paths', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.*.cookie'] }, stream)
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
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('redacts numbers at the top level', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['id'] }, stream)
  const obj = {
    id: 7915
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.id, '[Redacted]')
})

test('redacts booleans at the top level', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['maybe'] }, stream)
  const obj = {
    maybe: true
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.maybe, '[Redacted]')
})

test('redacts strings at the top level', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['s'] }, stream)
  const obj = {
    s: 's'
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.s, '[Redacted]')
})

test('does not redact primitives if not objects', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['a.b'] }, stream)
  const obj = {
    a: 42
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.a, 42)
})

test('redacts null at the top level', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['n'] }, stream)
  const obj = {
    n: null
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.n, '[Redacted]')
})

test('supports bracket notation', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['a["b.b"]'] }, stream)
  const obj = {
    a: { 'b.b': 'c' }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.a['b.b'], '[Redacted]')
})

test('supports bracket notation with further nesting', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['a["b.b"].c'] }, stream)
  const obj = {
    a: { 'b.b': { c: 'd' } }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.a['b.b'].c, '[Redacted]')
})

test('supports bracket notation with empty string as path segment', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['a[""].c'] }, stream)
  const obj = {
    a: { '': { c: 'd' } }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o.a[''].c, '[Redacted]')
})

test('supports leading bracket notation (single quote)', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['[\'a.a\'].b'] }, stream)
  const obj = {
    'a.a': { b: 'c' }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o['a.a'].b, '[Redacted]')
})

test('supports leading bracket notation (double quote)', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['["a.a"].b'] }, stream)
  const obj = {
    'a.a': { b: 'c' }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o['a.a'].b, '[Redacted]')
})

test('supports leading bracket notation (backtick quote)', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['[`a.a`].b'] }, stream)
  const obj = {
    'a.a': { b: 'c' }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o['a.a'].b, '[Redacted]')
})

test('supports leading bracket notation (single-segment path)', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['[`a.a`]'] }, stream)
  const obj = {
    'a.a': { b: 'c' }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o['a.a'], '[Redacted]')
})

test('supports leading bracket notation (single-segment path, wilcard)', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['[*]'] }, stream)
  const obj = {
    'a.a': { b: 'c' }
  }
  instance.info(obj)
  const o = await once(stream, 'data')
  is(o['a.a'], '[Redacted]')
})

test('child bindings are redacted using wildcard path', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['*.headers.cookie'] }, stream)
  instance.child({
    req: {
      method: 'GET',
      url: '/',
      headers: {
        cookie: 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;'
      }
    }
  }).info('message completed')
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
})

test('child bindings are redacted using wildcard and plain path keys', async ({ is }) => {
  const stream = sink()
  const instance = pino({ redact: ['req.method', '*.headers.cookie'] }, stream)
  instance.child({
    req: {
      method: 'GET',
      url: '/',
      headers: {
        cookie: 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;'
      }
    }
  }).info('message completed')
  const { req } = await once(stream, 'data')
  is(req.headers.cookie, '[Redacted]')
  is(req.method, '[Redacted]')
})
