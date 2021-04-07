'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { isAbsolute } = require('path')

const ThreadStream = require('thread-stream')

function transport (filename, workerData) {
  if (!(isAbsolute(filename) || filename.indexOf('file://') === 0)) {
    const callerRequire = createRequire(caller())
    filename = callerRequire.resolve(filename)
    console.log(filename)
  }

  const stream = new ThreadStream({
    filename,
    workerData,
    sync: true // TODO should this be configurable?
  })

  stream.unref()

  return stream
}

module.exports = transport
