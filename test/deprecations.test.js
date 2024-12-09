'use strict'
const { test } = require('tap')
const { future } = require('../lib/deprecations')
const { futureSym } = require('../lib/symbols')
const pino = require('../')

test('instance future is copied from default future', async ({ same, not }) => {
  const instance = pino()

  not(instance[futureSym], future)
  same(instance[futureSym], future)
})

test('instance future entries may be individually overridden by opts', async ({ match }) => {
  const opts = { future: { skipUnconditionalStdSerializers: true } }
  const instance = pino(opts)

  match(instance[futureSym], { skipUnconditionalStdSerializers: true })
})

test('instance future entries are kept, when not individually overridden in opts', async ({ match }) => {
  const instance = pino({ future: { foo: '-foo-' } })

  match(instance[futureSym], future) // this is true because opts.future does not override any default property
  match(instance[futureSym], { foo: '-foo-' })
})

test('instance future entries are immutable', async ({ throws }) => {
  const instance = pino({ future: { foo: '-foo-' } })

  throws(() => { instance[futureSym].foo = '-FOO-' }, TypeError)
})

test('child instance does not accept opts future', async ({ throws }) => {
  const parent = pino({ future: { foo: '-foo-' } })

  throws(() => parent.child({}, { future: { foo: '-FOO-' } }), RangeError)
})

test('child inherits future from parent and it is immutable', async ({ equal, throws }) => {
  const parent = pino({ future: { foo: '-foo-' } })
  const child = parent.child({})

  equal(child[futureSym], parent[futureSym])
  throws(() => { child[futureSym].foo = '-FOO-' }, TypeError)
})
