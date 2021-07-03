'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { join, isAbsolute } = require('path')

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
  const { targets, options = {}, worker = {} } = fullOptions
  // This function call MUST stay in the top-level function of this module
  const callerFile = caller()
  const callerRequire = createRequire(callerFile)

  let target = fullOptions.target

  if (target && targets) {
    throw new Error('Only one of target or targets can be specified')
  }

  if (targets) {
    target = join(__dirname, 'worker.js')
    options.targets = targets.map((dest) => {
      return {
        ...dest,
        target: fixTarget(dest.target)
      }
    })
  }

  return buildStream(fixTarget(target), options, worker)

  function fixTarget (origin) {
    if (isAbsolute(origin) || origin.indexOf('file://') === 0) {
      return origin
    }

    switch (origin) {
      case '#pino/pretty':
        return join(__dirname, 'pretty-target.js')
      case '#pino/file':
        return join(__dirname, 'file-target.js')
      /* istanbul ignore next */
      default:
        // TODO we cannot test this on Windows.. might not work.
        return callerRequire.resolve(origin)
    }
  }
}

module.exports = transport
