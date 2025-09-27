'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { join } = require('node:path')
const { fork } = require('node:child_process')
const tspl = require('@matteo.collina/tspl')
const { once } = require('./helper')
const pino = require('..')

if (process.platform === 'win32') {
  console.log('skipping on windows')
  process.exit(0)
}

function testFile (file) {
  file = join('fixtures', 'broken-pipe', file)
  test(file, async () => {
    const child = fork(join(__dirname, file), { silent: true })
    child.stdout.destroy()

    child.stderr.pipe(process.stdout)

    const res = await once(child, 'close')
    assert.equal(res, 0) // process exits successfully
  })
}

testFile('basic.js')
testFile('destination.js')
testFile('syncfalse.js')

test('let error pass through', async (t) => {
  const plan = tspl(t, { plan: 3 })
  const stream = pino.destination({ sync: true })

  // side effect of the pino constructor is that it will set an
  // event handler for error
  pino(stream)

  process.nextTick(() => stream.emit('error', new Error('kaboom')))
  process.nextTick(() => stream.emit('error', new Error('kaboom')))

  stream.on('error', (err) => {
    assert.equal(err.message, 'kaboom')
  })

  await plan
})
