'use strict'

const { Writable } = require('stream')
const { test } = require('tap')
const { join } = require('path')
const { fork } = require('child_process')
const writer = require('flush-write-stream')
const { once } = require('./helper')
const pino = require('../')

test('can be enabled via constructor', async ({isNot}) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'basic.js'), {silent: true})

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
})

test('can be enabled via constructor with pretty configuration', async ({isNot}) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'level-first.js'), {silent: true})

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/^INFO.*h/), null)
})

test('can be enabled via constructor with prettifier', async ({isNot}) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'pretty-factory.js'), {silent: true})

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')
  isNot(actual.match(/^INFO.*h/), null)
})

test('does not throw error when enabled with stream specified', async () => {
  pino({prettyPrint: true}, process.stdout)
})

test('can send pretty print to custom stream', async ({is}) => {
  const dest = new Writable({
    objectMode: true,
    write (formatted, enc) {
      is(/^INFO.*foo\n$/.test(formatted), true)
    }
  })

  const log = pino({
    prettifier: require('pino-pretty'),
    prettyPrint: {
      levelFirst: true
    }
  }, dest)
  log.info('foo')
})

test('ignores `undefined` from prettifier', async ({is}) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'pretty', 'skipped-output.js'), {silent: true})

  child.stdout.pipe(writer((s, enc) => {
    actual += s
  }))

  await once(child, 'close')
  is(actual, '')
})
