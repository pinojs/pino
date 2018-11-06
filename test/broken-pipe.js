'use strict'

const t = require('tap')
const { join } = require('path')
const { fork } = require('child_process')
const { once } = require('./helper')

function test (file) {
  file = join('fixtures', 'broken-pipe', file)
  t.test(file, { parallel: true }, async ({ is }) => {
    const child = fork(join(__dirname, file), { silent: true })
    child.stdout.destroy()

    child.stderr.pipe(process.stdout)

    const res = await once(child, 'close')
    is(res, 0) // process exits successfully
  })
}

t.jobs = 42

test('basic.js')
test('destination.js')
test('extreme.js')
