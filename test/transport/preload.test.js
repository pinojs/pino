'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const { readFile } = require('node:fs').promises
const execa = require('execa')

const { file, watchFileCreated } = require('../helper')

test('pino.transport works when loaded via --import preload', async () => {
  const destination = file()
  const preload = pathToFileURL(join(__dirname, '..', 'fixtures', 'transport-preload.mjs')).href
  const main = join(__dirname, '..', 'fixtures', 'transport-preload-main.mjs')

  await execa(process.argv[0], [
    `--import=${preload}`,
    main,
    destination
  ], { timeout: 10000 })

  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  assert.equal(result.msg, 'hello from main')
})
