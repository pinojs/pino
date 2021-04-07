'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { isAbsolute } = require('path')

const ThreadStream = require('thread-stream')

function transport (filename, workerData) {
  // Unreachable on Windows, so we ignore coverage here.
  /* istanbul ignore start */
  if (!(isAbsolute(filename) || filename.indexOf('file://') === 0)) {
    const callerRequire = createRequire(caller())
    filename = callerRequire.resolve(filename)
  }
  /* istanbul ignore end */

  const stream = new ThreadStream({
    filename,
    workerData,
    sync: true // TODO should this be configurable?
  })

  stream.unref()

  return stream
}

module.exports = transport
