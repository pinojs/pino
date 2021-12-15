'use strict'

const fs = require('fs').promises
const { join } = require('path')
const { test } = require('tap')
const execa = require('execa')

const { once } = require('../helper')

test('prepare the external-app installation', async function ({ pass }) {
  const child = execa('npm', ['install', '--force'], { cwd: join(__dirname, 'external-app') })
  await once(child, 'close')
  pass('external-app installation completed')
})

test('app using a custom transport', async function (t) {
  const child = execa(process.argv[0], [join(__dirname, 'external-app', 'app-config')])
  await once(child, 'close')

  const transportFile = await fs.readFile(join(__dirname, 'external-app', 'app-config.log'), 'utf8')
  const json = JSON.parse(transportFile)
  t.match(json, {
    level: 30,
    msg: 'hello world, it works with custom config!'
  })
})

test('app using an internal transport', async function (t) {
  const child = execa(process.argv[0], [join(__dirname, 'external-app', 'app-module-config')])
  await once(child, 'close')

  const transportFile = await fs.readFile(join(__dirname, 'external-app', 'module-config.log'), 'utf8')
  const json = JSON.parse(transportFile)
  t.match(json, {
    level: 30,
    msg: 'hello world, it works!'
  })
})
