'use strict'

const { test } = require('tap')
const { join } = require('path')
const { fork, spawn } = require('child_process')
const { once } = require('./helper')
const writer = require('flush-write-stream')

const fixtures = join(__dirname, 'fixtures', 'events')

test('no event loop logs successfully', async ({is}) => {
  var output = ''
  const child = fork(join(fixtures, 'no-event-loop.js'), {silent: true})
  child.stdout.pipe(writer((s, enc, cb) => {
    output += s
    cb()
  }))
  await once(child, 'close')
  is(/"msg":"h"/.test(output), true)
})

test('terminates when uncaughtException is fired with onTerminate registered', async ({is}) => {
  var output = ''
  var errorOutput = ''
  const child = spawn(process.argv[0], [join(fixtures, 'uncaught-exception.js')], {silent: true})

  child.stdout.pipe(writer((s, enc, cb) => {
    output += s
    cb()
  }))

  child.stderr.pipe(writer((s, enc, cb) => {
    errorOutput += s
    cb()
  }))
  await once(child, 'close')
  is(/"msg":"h"/.test(output), true)
  is(/terminated/g.test(output), true)
  is(/this is not caught/g.test(errorOutput), true)
})

test('terminates when uncaughtException is fired without onTerminate registered', async ({is}) => {
  var output = ''
  const child = spawn(process.argv[0], [join(fixtures, 'uncaught-exception-no-terminate.js')], {silent: true})

  child.stdout.pipe(writer((s, enc, cb) => {
    output += s
    cb()
  }))
  const code = await once(child, 'exit')
  is(code, 1)
  is(/"msg":"h"/.test(output), true)
})

test('terminates on SIGHUP when no other handlers registered', async ({is}) => {
  var output = ''
  const child = spawn(process.argv[0], [join(fixtures, 'sighup-no-handler.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(process.stdout)
  setTimeout(() => child.kill('SIGHUP'), 2000)
  const code = await once(child, 'exit')
  is(code, 0)
  is(/"msg":"h"/.test(output), true)
})

test('lets app terminate when SIGHUP received with multiple handlers', async ({is}) => {
  var output = ''
  const child = spawn(process.argv[0], [join(fixtures, 'sighup-with-handler.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
    output += s
    cb()
  }))
  setTimeout(() => child.kill('SIGHUP'), 2000)
  const code = await once(child, 'exit')
  is(code, 0)
  is(/"msg":"h"/.test(output), true)
  is(/app sighup/.test(output), true)
})

test('destination', async ({is}) => {
  var output = ''
  const child = spawn(process.argv[0], [join(fixtures, 'destination.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(process.stdout)

  const code = await once(child, 'exit')
  is(code, 0)
  is(/"msg":"h"/.test(output), true)
})
