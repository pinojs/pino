'use strict'

const { Writable } = require('stream')
const { test } = require('tap')
const { join } = require('path')
const { fork } = require('child_process')
const writer = require('flush-write-stream')
const { once } = require('./helper')
const pino = require('../')

test('can be enabled via exported pino function', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'basic.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
})

test('can be enabled via exported pino function with pretty configuration', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'level-first.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/^INFO.*h/), null)
})

test('can be enabled via exported pino function with prettifier', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'pretty-factory.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')
  isNot(actual.match(/^INFO.*h/), null)
})

test('does not throw error when enabled with stream specified', async ({ doesNotThrow }) => {
  doesNotThrow(() => pino({ prettyPrint: true }, process.stdout))
})

test('throws when prettyPrint is true but pino-pretty module is not installed', async ({ throws, is }) => {
  // pino pretty *is* installed, and probably also cached, so rather than
  // messing with the filesystem the simplest way to generate a not found
  // error is to simulate it:
  const prettyFactory = require('pino-pretty')
  require.cache[require.resolve('pino-pretty')].exports = () => {
    throw Error(`Cannot find module 'pino-pretty'`)
  }
  throws(() => pino({ prettyPrint: true }))
  try { pino({ prettyPrint: true }) } catch ({ message }) {
    is(message, 'Missing `pino-pretty` module: `pino-pretty` must be installed separately')
  }

  require.cache[require.resolve('pino-pretty')].exports = prettyFactory
})

test('can send pretty print to custom stream', async ({ is }) => {
  const dest = new Writable({
    objectMode: true,
    write (formatted, enc) {
      is(/^INFO.*foo\n$/.test(formatted), true)
    }
  })

  const log = pino({
    prettifier: require('pino-pretty'),
    prettyPrint: {
      levelFirst: true,
      colorize: false
    }
  }, dest)
  log.info('foo')
})

test('ignores `undefined` from prettifier', async ({ is }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'skipped-output.js'), { silent: true })

  child.stdout.pipe(writer((s, enc) => {
    actual += s
  }))

  await once(child, 'close')
  is(actual, '')
})

test('parses and outputs chindings', async ({ is, isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'child.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h2/), null)
  isNot(actual.match(/a: 1/), null)
  isNot(actual.match(/b: 2/), null)
  is(actual.match(/a: 1/g).length, 3)
})

test('applies serializers', async ({ is, isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'serializers.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
  isNot(actual.match(/foo: "bar"/), null)
})

test('applies redaction rules', async ({ is, isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'redact.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
  isNot(actual.match(/\[Redacted\]/), null)
  is(actual.match(/object/), null)
})

test('dateformat', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'dateformat.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
})

test('without timestamp', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'no-time.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.slice(2), '[]')
})

test('with custom timestamp', async ({ is }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'custom-time.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  is(actual.slice(0, 8), '["test"]')
})

test('errors', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'error.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): kaboom/), null)
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): with a message/), null)
  isNot(actual.match(/.*error\.js.*/), null)
})

test('errors with props', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'error-props.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): kaboom/), null)
  isNot(actual.match(/code: ENOENT/), null)
  isNot(actual.match(/errno: 1/), null)
  isNot(actual.match(/.*error-props\.js.*/), null)
})
