'use strict'

const { test } = require('tap')
const { sink } = require('./helper')
const pino = require('../')

test('redact option – throws if not array', async ({throws}) => {
  throws(() => {
    pino({redact: 'req.headers.cookie'})
  })
})

test('redact option – throws if array does not only contain strings', async ({throws}) => {
  throws(() => {
    pino({redact: ['req.headers.cookie', {}]})
  })
})

test('redact option – throws if array contains an invalid path', async ({throws}) => {
  throws(() => {
    pino({redact: ['req,headers.cookie']})
  })
})

test('redact.paths option – throws if not array', async ({throws}) => {
  throws(() => {
    pino({redact: {paths: 'req.headers.cookie'}})
  })
})

test('redact.paths option – throws if array does not only contain strings', async ({throws}) => {
  throws(() => {
    pino({redact: {paths: ['req.headers.cookie', {}]}})
  })
})

test('redact.paths option – throws if array contains an invalid path', async ({throws}) => {
  throws(() => {
    pino({redact: {paths: ['req,headers.cookie']}})
  })
})

test('redact.censor option – throws if censor is a function', async ({throws}) => {
  throws(() => {
    pino({redact: {paths: ['req.headers.cookie'], censor: () => {}}})
  })
})

test('redact option – top level key', async ({is}) => {
  const instance = pino({redact: ['key']}, sink(function (o, enc) {
    is(o.key, '[Redacted]')
  }))
  instance.info({
    key: {redact: 'me'}
  })
})

test('redact option – object', async ({is}) => {
  const instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
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

test('redact option – child object', async ({is}) => {
  const instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
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

test('redact option – interpolated object', async ({is}) => {
  const instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc) {
    is(JSON.parse(o.msg.replace(/test /, '')).req.headers.cookie, '[Redacted]')
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

test('redact.paths option – object', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
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

test('redact.paths option – child object', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
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

test('redact.paths option – interpolated object', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc) {
    is(JSON.parse(o.msg.replace(/test /, '')).req.headers.cookie, '[Redacted]')
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

test('redact.censor option – sets the redact value', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie'], censor: 'test'}}, sink(function (o, enc) {
    is(o.req.headers.cookie, 'test')
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

test('redact.remove option – removes both key and value', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie'], remove: true}}, sink(function (o, enc) {
    is('cookie' in o.req.headers, false)
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

test('redact.remove – top level key', async ({is}) => {
  const instance = pino({redact: {paths: ['key'], remove: true}}, sink(function (o, enc) {
    is('key' in o, false)
  }))
  instance.info({
    key: {redact: 'me'}
  })
})

test('redact.paths preserves original object values after the log write', async ({is}) => {
  const instance = pino({redact: ['req.headers.cookie']}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
    is(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
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

test('redact.paths preserves original object values after the log write', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie']}}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
    is(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
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

test('redact.censor preserves original object values after the log write', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie'], censor: 'test'}}, sink(function (o, enc) {
    is(o.req.headers.cookie, 'test')
    is(obj.req.headers.cookie, 'SESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;')
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

test('redact.remove preserves original object values after the log write', async ({is}) => {
  const instance = pino({redact: {paths: ['req.headers.cookie'], remove: true}}, sink(function (o, enc) {
    is('cookie' in o.req.headers, false)
    is('cookie' in obj.req.headers, true)
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

test('redact – supports last position wildcard paths', async ({is}) => {
  const instance = pino({redact: ['req.headers.*']}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
    is(o.req.headers.host, '[Redacted]')
    is(o.req.headers.connection, '[Redacted]')
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

test('redact – supports intermediate wildcard paths', async ({is}) => {
  const instance = pino({redact: ['req.*.cookie']}, sink(function (o, enc) {
    is(o.req.headers.cookie, '[Redacted]')
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
