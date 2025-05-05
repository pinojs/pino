'use strict'

const writeStream = require('flush-write-stream')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const test = require('node:test').test
const pino = require('../')
const multistream = pino.multistream
const proxyquire = require('proxyquire')
const strip = require('strip-ansi')
const { file, sink } = require('./helper')

test('sends to multiple streams using string levels', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const streams = [
    { stream },
    { level: 'debug', stream },
    { level: 'trace', stream },
    { level: 'fatal', stream },
    { level: 'silent', stream }
  ]
  const log = pino({
    level: 'trace'
  }, multistream(streams))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 9)
  end()
})

test('sends to multiple streams using custom levels', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const streams = [
    { stream },
    { level: 'debug', stream },
    { level: 'trace', stream },
    { level: 'fatal', stream },
    { level: 'silent', stream }
  ]
  const log = pino({
    level: 'trace'
  }, multistream(streams))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 9)
  end()
})

test('sends to multiple streams using optionally predefined levels', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const opts = {
    levels: {
      silent: Infinity,
      fatal: 60,
      error: 50,
      warn: 50,
      info: 30,
      debug: 20,
      trace: 10
    }
  }
  const streams = [
    { stream },
    { level: 'trace', stream },
    { level: 'debug', stream },
    { level: 'info', stream },
    { level: 'warn', stream },
    { level: 'error', stream },
    { level: 'fatal', stream },
    { level: 'silent', stream }
  ]
  const mstream = multistream(streams, opts)
  const log = pino({
    level: 'trace'
  }, mstream)
  log.trace('trace stream')
  log.debug('debug stream')
  log.info('info stream')
  log.warn('warn stream')
  log.error('error stream')
  log.fatal('fatal stream')
  log.silent('silent stream')
  t.assert.strictEqual(messageCount, 24)
  end()
})

test('sends to multiple streams using number levels', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const streams = [
    { stream },
    { level: 20, stream },
    { level: 60, stream }
  ]
  const log = pino({
    level: 'debug'
  }, multistream(streams))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 6)
  end()
})

test('level include higher levels', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const log = pino({}, multistream([{ level: 'info', stream }]))
  log.fatal('message')
  t.assert.strictEqual(messageCount, 1)
  end()
})

test('supports multiple arguments', (t, end) => {
  const messages = []
  const stream = writeStream(function (data, enc, cb) {
    messages.push(JSON.parse(data))
    if (messages.length === 2) {
      const msg1 = messages[0]
      t.assert.strictEqual(msg1.msg, 'foo bar baz foobar')

      const msg2 = messages[1]
      t.assert.strictEqual(msg2.msg, 'foo bar baz foobar barfoo foofoo')

      end()
    }
    cb()
  })
  const log = pino({}, multistream({ stream }))
  log.info('%s %s %s %s', 'foo', 'bar', 'baz', 'foobar') // apply not invoked
  log.info('%s %s %s %s %s %s', 'foo', 'bar', 'baz', 'foobar', 'barfoo', 'foofoo') // apply invoked
})

test('supports children', (t, end) => {
  const stream = writeStream(function (data, enc, cb) {
    const input = JSON.parse(data)
    t.assert.strictEqual(input.msg, 'child stream')
    t.assert.strictEqual(input.child, 'one')
    end()
    cb()
  })
  const streams = [
    { stream }
  ]
  const log = pino({}, multistream(streams)).child({ child: 'one' })
  log.info('child stream')
})

test('supports grandchildren', (t, end) => {
  const messages = []
  const stream = writeStream(function (data, enc, cb) {
    messages.push(JSON.parse(data))
    if (messages.length === 3) {
      const msg1 = messages[0]
      t.assert.strictEqual(msg1.msg, 'grandchild stream')
      t.assert.strictEqual(msg1.child, 'one')
      t.assert.strictEqual(msg1.grandchild, 'two')

      const msg2 = messages[1]
      t.assert.strictEqual(msg2.msg, 'grandchild stream')
      t.assert.strictEqual(msg2.child, 'one')
      t.assert.strictEqual(msg2.grandchild, 'two')

      const msg3 = messages[2]
      t.assert.strictEqual(msg3.msg, 'debug grandchild')
      t.assert.strictEqual(msg3.child, 'one')
      t.assert.strictEqual(msg3.grandchild, 'two')

      end()
    }
    cb()
  })
  const streams = [
    { stream },
    { level: 'debug', stream }
  ]
  const log = pino({
    level: 'debug'
  }, multistream(streams)).child({ child: 'one' }).child({ grandchild: 'two' })
  log.info('grandchild stream')
  log.debug('debug grandchild')
})

test('supports custom levels', (t, end) => {
  const stream = writeStream(function (data, enc, cb) {
    t.assert.strictEqual(JSON.parse(data).msg, 'bar')
    end()
  })
  const log = pino({
    customLevels: {
      foo: 35
    }
  }, multistream([{ level: 35, stream }]))
  log.foo('bar')
})

test('supports pretty print', (t) => {
  t.plan(2)
  const stream = writeStream(function (data, enc, cb) {
    t.assert.notEqual(strip(data.toString()).match(/INFO.*: pretty print/), null)
    cb()
  })

  const safeBoom = proxyquire('pino-pretty/lib/utils/build-safe-sonic-boom.js', {
    'sonic-boom': function () {
      t.assert.ok('sonic created')
      stream.flushSync = () => {}
      stream.flush = () => {}
      return stream
    }
  })
  const nested = proxyquire('pino-pretty/lib/utils/index.js', {
    './build-safe-sonic-boom.js': safeBoom
  })
  const pretty = proxyquire('pino-pretty', {
    './lib/utils/index.js': nested
  })

  const log = pino({
    level: 'debug',
    name: 'helloName'
  }, multistream([
    { stream: pretty() }
  ]))

  log.info('pretty print')
})

test('emit propagates events to each stream', (t) => {
  t.plan(3)
  const handler = function (data) {
    t.assert.strictEqual(data.msg, 'world')
  }
  const streams = [sink(), sink(), sink()]
  streams.forEach(function (s) {
    s.once('hello', handler)
  })
  const stream = multistream(streams)
  stream.emit('hello', { msg: 'world' })
})

test('children support custom levels', (t, end) => {
  const stream = writeStream(function (data, enc, cb) {
    t.assert.strictEqual(JSON.parse(data).msg, 'bar')
    end()
  })
  const parent = pino({
    customLevels: {
      foo: 35
    }
  }, multistream([{ level: 35, stream }]))
  const child = parent.child({ child: 'yes' })
  child.foo('bar')
})

test('levelVal overrides level', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const streams = [
    { stream },
    { level: 'blabla', levelVal: 15, stream },
    { level: 60, stream }
  ]
  const log = pino({
    level: 'debug'
  }, multistream(streams))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 6)
  end()
})

test('forwards metadata', (t, end) => {
  t.plan(4)
  const streams = [
    {
      stream: {
        [Symbol.for('pino.metadata')]: true,
        write (chunk) {
          t.assert.strictEqual(log, this.lastLogger)
          t.assert.strictEqual(30, this.lastLevel)
          t.assert.deepStrictEqual({ hello: 'world' }, this.lastObj)
          t.assert.deepStrictEqual('a msg', this.lastMsg)
        }
      }
    }
  ]

  const log = pino({
    level: 'debug'
  }, multistream(streams))

  log.info({ hello: 'world' }, 'a msg')
  end()
})

test('forward name', (t, end) => {
  t.plan(2)
  const streams = [
    {
      stream: {
        [Symbol.for('pino.metadata')]: true,
        write (chunk) {
          const line = JSON.parse(chunk)
          t.assert.strictEqual(line.name, 'helloName')
          t.assert.strictEqual(line.hello, 'world')
        }
      }
    }
  ]

  const log = pino({
    level: 'debug',
    name: 'helloName'
  }, multistream(streams))

  log.info({ hello: 'world' }, 'a msg')
  end()
})

test('forward name with child', (t, end) => {
  t.plan(3)
  const streams = [
    {
      stream: {
        write (chunk) {
          const line = JSON.parse(chunk)
          t.assert.strictEqual(line.name, 'helloName')
          t.assert.strictEqual(line.hello, 'world')
          t.assert.strictEqual(line.component, 'aComponent')
        }
      }
    }
  ]

  const log = pino({
    level: 'debug',
    name: 'helloName'
  }, multistream(streams)).child({ component: 'aComponent' })

  log.info({ hello: 'world' }, 'a msg')
  end()
})

test('clone generates a new multistream with all stream at the same level', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const streams = [
    { stream },
    { level: 'debug', stream },
    { level: 'trace', stream },
    { level: 'fatal', stream }
  ]
  const ms = multistream(streams)
  const clone = ms.clone(30)

  t.assert.notEqual(clone, ms)

  clone.streams.forEach((s, i) => {
    t.assert.notEqual(s, streams[i])
    t.assert.strictEqual(s.stream, streams[i].stream)
    t.assert.strictEqual(s.level, 30)
  })

  const log = pino({
    level: 'trace'
  }, clone)

  log.info('info stream')
  log.debug('debug message not counted')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 8)

  end()
})

test('one stream', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const log = pino({
    level: 'trace'
  }, multistream({ stream, level: 'fatal' }))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 1)
  end()
})

test('dedupe', (t, end) => {
  let messageCount = 0
  const stream1 = writeStream(function (data, enc, cb) {
    messageCount -= 1
    cb()
  })

  const stream2 = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })

  const streams = [
    {
      stream: stream1,
      level: 'info'
    },
    {
      stream: stream2,
      level: 'fatal'
    }
  ]

  const log = pino({
    level: 'trace'
  }, multistream(streams, { dedupe: true }))
  log.info('info stream')
  log.fatal('fatal stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 1)
  end()
})

test('dedupe when logs have different levels', (t, end) => {
  let messageCount = 0
  const stream1 = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })

  const stream2 = writeStream(function (data, enc, cb) {
    messageCount += 2
    cb()
  })

  const streams = [
    {
      stream: stream1,
      level: 'info'
    },
    {
      stream: stream2,
      level: 'error'
    }
  ]

  const log = pino({
    level: 'trace'
  }, multistream(streams, { dedupe: true }))

  log.info('info stream')
  log.warn('warn stream')
  log.error('error streams')
  log.fatal('fatal streams')
  t.assert.strictEqual(messageCount, 6)
  end()
})

test('dedupe when some streams has the same level', (t, end) => {
  let messageCount = 0
  const stream1 = writeStream(function (data, enc, cb) {
    messageCount -= 1
    cb()
  })

  const stream2 = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })

  const stream3 = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })

  const streams = [
    {
      stream: stream1,
      level: 'info'
    },
    {
      stream: stream2,
      level: 'fatal'
    },
    {
      stream: stream3,
      level: 'fatal'
    }
  ]

  const log = pino({
    level: 'trace'
  }, multistream(streams, { dedupe: true }))
  log.info('info stream')
  log.fatal('fatal streams')
  log.fatal('fatal streams')
  t.assert.strictEqual(messageCount, 3)
  end()
})

test('no stream', (t, end) => {
  const log = pino({
    level: 'trace'
  }, multistream())
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  end()
})

test('one stream', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const log = pino({
    level: 'trace'
  }, multistream(stream))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 2)
  end()
})

test('add a stream', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })

  const log = pino({
    level: 'trace'
  }, multistream().add(stream))
  log.info('info stream')
  log.debug('debug stream')
  log.fatal('fatal stream')
  t.assert.strictEqual(messageCount, 2)
  end()
})

test('multistream.add throws if not a stream', (t, end) => {
  try {
    pino({
      level: 'trace'
    }, multistream().add({}))
  } catch (_) {
    end()
  }
})

test('multistream throws if not a stream', (t, end) => {
  try {
    pino({
      level: 'trace'
    }, multistream({}))
  } catch (_) {
    end()
  }
})

test('multistream.write should not throw if one stream fails', (t, end) => {
  let messageCount = 0
  const stream = writeStream(function (data, enc, cb) {
    messageCount += 1
    cb()
  })
  const noopStream = pino.transport({
    target: join(__dirname, 'fixtures', 'noop-transport.js')
  })
  // eslint-disable-next-line
  noopStream.on('error', function (err) {
    // something went wrong while writing to noop stream, ignoring!
  })
  const log = pino({
    level: 'trace'
  },
  multistream([
    {
      level: 'trace',
      stream
    },
    {
      level: 'debug',
      stream: noopStream
    }
  ])
  )
  log.debug('0')
  noopStream.end()
  // noop stream is ending, should emit an error but not throw
  log.debug('1')
  log.debug('2')
  t.assert.strictEqual(messageCount, 3)
  end()
})

test('flushSync', (t, end) => {
  const tmp = file()
  const destination = pino.destination({ dest: tmp, sync: false, minLength: 4096 })
  const stream = multistream([{ level: 'info', stream: destination }])
  const log = pino({ level: 'info' }, stream)
  destination.on('ready', () => {
    log.info('foo')
    log.info('bar')
    stream.flushSync()
    t.assert.strictEqual(readFileSync(tmp, { encoding: 'utf-8' }).split('\n').length - 1, 2)
    log.info('biz')
    stream.flushSync()
    t.assert.strictEqual(readFileSync(tmp, { encoding: 'utf-8' }).split('\n').length - 1, 3)
    end()
  })
})

test('ends all streams', (t) => {
  t.plan(7)
  const stream = writeStream(function (data, enc, cb) {
    t.assert.ok('message')
    cb()
  })
  stream.flushSync = function () {
    t.assert.ok('flushSync')
  }
  // stream2 has no flushSync
  const stream2 = writeStream(function (data, enc, cb) {
    t.assert.ok('message2')
    cb()
  })
  const streams = [
    { stream },
    { level: 'debug', stream },
    { level: 'trace', stream: stream2 },
    { level: 'fatal', stream },
    { level: 'silent', stream }
  ]
  const multi = multistream(streams)
  const log = pino({
    level: 'trace'
  }, multi)
  log.info('info stream')
  multi.end()
})
