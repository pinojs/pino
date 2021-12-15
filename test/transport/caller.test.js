'use strict'

const writer = require('flush-write-stream')
const { join } = require('path')
const { test } = require('tap')
const execa = require('execa')

const { once } = require('../helper')

test('app using a custom transport', async function (t) {
  const evalApp = join(__dirname, '../', '/fixtures/eval')
  const child = execa(process.argv[0], [evalApp])

  let actual = ''
  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))

  await once(child, 'close')

  t.match(actual, /done!/)
})
