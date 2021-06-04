'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { join } = require('path')

const ThreadStream = require('thread-stream')

function buildStream (filename, workerData, workerOpts) {
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

function transport (fullOptions) {
  const { destinations, options = {}, module, worker = {} } = fullOptions
  // This function call MUST stay in the top-level function of this module
  const callerFile = caller()
  const callerRequire = createRequire(callerFile)

  let source = fullOptions.source

  if (
    (source && destinations) ||
    (source && module) ||
    (module && destinations)) {
    throw new Error('Only one of source, destinations or module can be specified')
  }

  // TODO validate only one of the options can be set

  if (destinations) {
    source = join(__dirname, 'worker.js')
    options.destinations = destinations.map((dest) => {
      // TODO validate dest
      if (!dest.module) {
        return dest
      }

      return {
        ...dest,
        module: undefined,
        source: callerRequire.resolve(dest.module)
      }
    })
  }

  // TODO we cannot test this on Windows.. might not work.
  /* istanbul ignore if */
  if (module) {
    source = callerRequire.resolve(module)
  }

  return buildStream(source, options, worker)
}

module.exports = transport
