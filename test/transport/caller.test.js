'use strict'

const writer = require('flush-write-stream')
const { join } = require('path')
const { test } = require('tap')
const execa = require('execa')

const { once } = require('../helper')

test('when using a custom transport outside node_modules, the first file outside node_modules should be used', async function (t) {
  const evalApp = join(__dirname, '../', '/fixtures/eval/index.js')
  const child = execa(process.argv[0], [evalApp])

  let actual = ''
  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  t.match(actual, /done!/)
})

test('when using a custom transport where some files in stacktrace are in the node_modules, the first file outside node_modules should be used', async function (t) {
  const evalApp = join(__dirname, '../', '/fixtures/eval/node_modules/2-files.js')
  const child = execa(process.argv[0], [evalApp])

  let actual = ''
  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  t.match(actual, /done!/)
})

test('when using a custom transport where all files in stacktrace are in the node_modules, the first file inside node_modules should be used', async function (t) {
  const evalApp = join(__dirname, '../', '/fixtures/eval/node_modules/14-files.js')
  const child = execa(process.argv[0], [evalApp])

  let actual = ''
  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  t.match(actual, /done!/)
})
