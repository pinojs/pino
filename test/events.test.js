'use strict'

const { test } = require('tap')
const { join } = require('path')
const { fork, spawn } = require('child_process')
const { once } = require('./helper')

const fixtures = join(__dirname, 'fixtures', 'events')

test('no event loop logs successfully', async ({is}) => {
  const child = fork(join(fixtures, 'no-event-loop.js'), {silent: true})
  const output = await once(child.stdout, 'data')
  await once(child, 'close')
  is(/"msg":"h"/.test(await output), true)
})

test('terminates when uncaughtException is fired with onTerminate registered', async ({is}) => {
  const child = spawn(process.argv[0], [join(fixtures, 'uncaught-exception.js')], {silent: true})
  const output = once(child.stdout, 'data')
  const output2 = output.then(() => once(child.stdout, 'data'))
  const errorOutput = once(child.stderr, 'data')
  await once(child, 'close')
  is(/"msg":"h"/.test(await output), true)
  is(/terminated/g.test(await output2), true)
  is(/this is not caught/g.test(await errorOutput), true)
})

test('terminates when uncaughtException is fired without onTerminate registered', async ({is}) => {
  const child = spawn(process.argv[0], [join(fixtures, 'uncaught-exception-no-terminate.js')], {silent: true})
  const output = once(child.stdout, 'data')
  const code = await once(child, 'exit')
  is(code, 1)
  is(/"msg":"h"/.test(await output), true)
})

test('terminates on SIGHUP when no other handlers registered', async ({is}) => {
  const child = spawn(process.argv[0], [join(fixtures, 'sighup-no-handler.js')], {silent: true})
  await once(child.stdout, 'data')
  const output = once(child.stdout, 'data')
  child.kill('SIGHUP')
  const code = await once(child, 'exit')
  is(code, 0)
  is(/"msg":"h"/.test(await output), true)
})

test('lets app terminate when SIGHUP received with multiple handlers', async ({is}) => {
  const child = spawn(process.argv[0], [join(fixtures, 'sighup-with-handler.js')], {silent: true})
  await once(child.stdout, 'data')
  const output = once(child.stdout, 'data')
  const output2 = output.then(() => once(child.stdout, 'data'))
  child.kill('SIGHUP')
  const code = await once(child, 'exit')
  is(code, 0)
  is(/"msg":"h"/.test(await output + ''), true)
  is(/app sighup/.test(await output2 + ''), true)
})

test('destination', async ({is}) => {
  const child = spawn(process.argv[0], [join(fixtures, 'destination.js')], {silent: true})
  const output = once(child.stdout, 'data')
  const code = await once(child, 'exit')
  is(code, 0)
  is(/"msg":"h"/.test(await output), true)
})
