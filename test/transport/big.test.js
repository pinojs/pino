'use strict'

const { test } = require('tap')
const { join } = require('path')
const { once } = require('events')
const { createReadStream } = require('fs')
const { promisify } = require('util')
const execa = require('execa')
const split = require('split2')
const stream = require('stream')
const { file } = require('../helper')

const pipeline = promisify(stream.pipeline)
const { Writable } = stream
const sleep = promisify(setTimeout)

test('eight million lines', async ({ equal, comment }) => {
  const destination = file()
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-many-lines.js'), destination])

  await once(child, 'exit')
  await sleep(1000) // wait for the file to be written
  const toWrite = 8 * 1000000
  let count = 0
  await pipeline(createReadStream(destination), split(), new Writable({
    write (chunk, enc, cb) {
      if (count % (toWrite / 10) === 0) {
        comment(`read ${count}`)
      }
      count++
      cb()
    }
  }))
  equal(count, toWrite)
})
