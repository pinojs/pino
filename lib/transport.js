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

function transport (options) {
  const { destinations, opts = {}, module, workerOpts = {} } = options
  // This function call MUST stay in the top-level function of this module
  const callerFile = caller()
  const callerRequire = createRequire(callerFile)

  let src = options.src

  if (
    (src && destinations) ||
    (src && module) ||
    (module && destinations)) {
    throw new Error('Only one of src, destinations or module can be specified')
  }

  // TODO validate only one of the options can be set

  if (destinations) {
    src = join(__dirname, 'worker.js')
    opts.destinations = destinations.map((dest) => {
      // TODO validate dest
      if (!dest.module) {
        return dest
      }

      return {
        ...dest,
        module: undefined,
        src: callerRequire.resolve(dest.module)
      }
    })
  }

  // TODO we cannot test this on Windows.. might not work.
  /* istanbul ignore if */
  if (module) {
    src = callerRequire.resolve(module)
  }

  // console.log(options, src)

  return buildStream(src, opts, workerOpts)
}

module.exports = transport
