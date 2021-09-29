'use strict'

const os = require('os')
const { join } = require('path')
const { readFile, symlink, unlink } = require('fs').promises
const { test } = require('tap')
const { isWin, isYarnPnp, watchFileCreated } = require('../helper')
const pino = require('../../')

const { pid } = process
const hostname = os.hostname()

async function installTransportModule () {
  if (isYarnPnp) {
    return
  }
  try {
    await uninstallTransportModule()
  } catch {}
  await symlink(
    join(__dirname, '..', 'fixtures', 'transport'),
    join(__dirname, '..', '..', 'node_modules', 'transport')
  )
}

async function uninstallTransportModule () {
  if (isYarnPnp) {
    return
  }
  await unlink(join(__dirname, '..', '..', 'node_modules', 'transport'))
}

// TODO make this test pass on Windows
test('pino.transport with package', { skip: isWin }, async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  await installTransportModule()

  const transport = pino.transport({
    target: 'transport',
    options: { destination }
  })
  teardown(async () => {
    await uninstallTransportModule()
    transport.end()
  })
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

// TODO make this test pass on Windows
test('pino.transport with package as a target', { skip: isWin }, async ({ same, teardown }) => {
  const destination = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )

  await installTransportModule()

  const transport = pino.transport({
    targets: [{
      target: 'transport',
      options: { destination }
    }]
  })
  teardown(async () => {
    await uninstallTransportModule()
    transport.end()
  })
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})
