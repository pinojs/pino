'use strict'

const fs = require('fs')
const { once } = require('events')

module.exports = async (options) => {
  const stream = fs.createWriteStream(options.destination)
  await once(stream, 'open')
  return stream
}
