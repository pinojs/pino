'use strict'

const { test } = require('tap')
const pino = require('..')
const { symbols } = pino
const { join } = require('path')
const { fork } = require('child_process')
const { once } = require('./helper')
const writer = require('flush-write-stream')

test('do not use SonicBoom on AWS Lambda', async (t) => {
  // hack, we are on lambda now
  process.env.LAMBDA_TASK_ROOT = __dirname

  // we need to clear the cache
  delete require.cache[require.resolve('../')]
  delete require.cache[require.resolve('../lib/tools.js')]
  const pino = require('..')

  // restore in the next tick
  process.nextTick(() => {
    delete process.env.LAMBDA_TASK_ROOT
  })

  const logger = pino()

  // this test verifies that the default constructor of pino
  // does not use SonicBoom on lambda by default
  t.equal(logger[symbols.streamSym], process.stdout)
})

test('do not use SonicBoom is someone tampered with process.stdout.write', async ({ isNot }) => {
  var actual = ''
  const child = fork(join(__dirname, 'fixtures', 'stdout-hack-protection.js'), { silent: true })

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  isNot(actual.match(/^hack/), null)
})
