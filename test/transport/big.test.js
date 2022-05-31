'use strict'

const { test } = require('tap')
const { join } = require('path')
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
  await execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-many-lines.js'), destination])

  if (process.platform !== 'win32') {
    try {
      await execa('sync') // Wait for the file to be written to disk
    } catch {
      // Just a fallback, this should be unreachable
    }
  }
  await sleep(1000) // It seems that sync is not enough (even in POSIX systems)

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
