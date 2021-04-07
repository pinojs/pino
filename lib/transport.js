'use strict'

const ThreadStream = require('thread-stream')

function transport (filename, workerData) {
  const stream = new ThreadStream({
    filename,
    workerData,
    sync: true // TODO should this be configurable?
  })

  stream.unref()

  return stream
}

module.exports = transport
