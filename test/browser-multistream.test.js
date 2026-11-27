'use strict'
const test = require('tape')
const pino = require('../browser')

test('multistream is a function on the browser export', ({ end, is }) => {
  is(typeof pino.multistream, 'function')
  end()
})

test('writes to multiple streams respecting per-stream levels', ({ end, deepEqual }) => {
  const a = []
  const b = []
  const log = pino({ level: 'debug' }, pino.multistream([
    { level: 'info', stream: { write: (o) => a.push(o) } },
    { level: 'debug', stream: { write: (o) => b.push(o) } }
  ]))

  log.info('hello info')
  log.debug('hello debug')
  log.trace('hello trace')

  deepEqual(a.map(o => o.msg), ['hello info'])
  deepEqual(b.map(o => o.msg), ['hello info', 'hello debug'])
  end()
})

test('supports a bare destination object as the second argument', ({ end, is, deepEqual }) => {
  const out = []
  const log = pino({ browser: {} }, { write: (o) => out.push(o) })

  log.info('bare dest')

  deepEqual(out.map(o => o.msg), ['bare dest'])
  is(out[0].level, 30)
  end()
})

test('stream without an explicit level defaults to info', ({ end, deepEqual }) => {
  const out = []
  const log = pino({ level: 'trace' }, pino.multistream([
    { stream: { write: (o) => out.push(o) } }
  ]))

  log.trace('no trace expected')
  log.info('info ok')

  deepEqual(out.map(o => o.msg), ['info ok'])
  end()
})

test('child loggers route bindings through the destination', ({ end, is, deepEqual }) => {
  const out = []
  const log = pino({ browser: {} }, pino.multistream([
    { level: 'info', stream: { write: (o) => out.push(o) } }
  ]))

  log.child({ req: 1 }).info('child log')

  is(out.length, 1)
  is(out[0].req, 1)
  is(out[0].msg, 'child log')
  end()
})

test('setBindings reflects in multistream output', ({ end, is }) => {
  const out = []
  const log = pino({ browser: {} }, pino.multistream([
    { level: 'info', stream: { write: (o) => out.push(o) } }
  ]))

  log.setBindings({ answer: 42 })
  log.info('test')

  is(out[0].answer, 42)
  end()
})

test('throws when destination has no write method', ({ end, throws }) => {
  throws(() => pino({ browser: {} }, {}), /destination must have a write method/)
  end()
})
