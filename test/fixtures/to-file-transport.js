'use strict'

const fs = require('fs')
const { once } = require('events')

async function run (opts) {
  // throw an empty error for now so as not to pollute test output
  // when thread stream propagates errors to main thread, make this an error
  // message that can be matched against
  // eslint-disable-next-line
  if (!opts.destination) throw ''
  const stream = fs.createWriteStream(opts.destination)
  await once(stream, 'open')
  return stream
}

module.exports = run
