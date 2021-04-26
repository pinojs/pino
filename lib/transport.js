'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { isAbsolute, join } = require('path')

const ThreadStream = require('thread-stream')

function transport (filename, workerData, workerOpts = {}) {
  if (!(isAbsolute(filename) || filename.indexOf('file://') === 0)) {
    const callerFile = caller()
    const callerRequire = createRequire(callerFile)
    filename = callerRequire.resolve(filename)
  }

  const stream = new ThreadStream({
    filename,
    workerData,
    workerOpts,
    sync: true // TODO should this be configurable?
  })

  stream.on('ready', function () {
    stream.unref()
  })

  return stream
}

function multitrasport (...args) {
  if (Array.isArray(args[0])) {
    return transport(join(__dirname, 'worker.js'), args[0], args[1])
  }

  return transport(...args)
}

module.exports = multitrasport
