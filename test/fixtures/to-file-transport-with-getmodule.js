'use strict'

const fs = require('node:fs')
const { once } = require('node:events')

async function run (opts) {
  if (!opts.destination) throw new Error('kaboom')
  const stream = fs.createWriteStream(opts.destination)
  await once(stream, 'open')
  return stream
}

run.getModule = function () {
  return __filename
}

module.exports = run
