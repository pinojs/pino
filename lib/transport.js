'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { isAbsolute, join } = require('path')

const ThreadStream = require('thread-stream')

function transport (filename, opts = {}) {
  const { workerData = {}, destination, ...workerOpts } = opts

  if (destination) workerData.destination = destination

  const stream = new ThreadStream({
    filename,
    workerData,
    workerOpts,
    sync: true // TODO should this be configurable?
  })

  stream.on('ready', function () {
    stream.unref()

    if (workerOpts.autoEnd !== false) {
      // TODO possibly use FinalizationGroup to automatically remove
      // this listener if the stream goes out scope.
      process.on('exit', autoEnd)

      stream.on('close', function () {
        process.removeListener('exit', autoEnd)
      })
    }
  })

  return stream

  function autoEnd () {
    stream.end()
  }
}

function multitransport (...args) {
  if (Array.isArray(args[0])) {
    return transport(join(__dirname, 'worker.js'), { workerData: args[0], ...(args[1] || {}) })
  }

  let filename = args.shift()

  // TODO we cannot test this on Windows.. might not work.
  /* istanbul ignore if */
  if (!(isAbsolute(filename) || filename.indexOf('file://') === 0)) {
    // This function call MUST stay in the top-level function of this module
    const callerFile = caller()
    const callerRequire = createRequire(callerFile)
    filename = callerRequire.resolve(filename)
  }

  return transport(filename, ...args)
}

module.exports = multitransport
