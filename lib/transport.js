'use strict'

const { createRequire } = require('module')
const caller = require('get-caller-file')
const { join, isAbsolute } = require('path')

const ThreadStream = require('thread-stream')

function setupOnExit (stream) {
  /* istanbul ignore next */
  if (global.WeakRef && global.WeakMap && global.FinalizationRegistry) {
    // This is leak free, it does not leave event handlers
    const onExit = require('on-exit-leak-free')

    onExit.register(stream, autoEnd)

    stream.on('close', function () {
      onExit.unregister(stream)
    })
  } else {
    const fn = autoEnd.bind(null, stream)
    process.on('exit', fn)

    stream.on('close', function () {
      process.removeListener('exit', fn)
    })
  }
}

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
      setupOnExit(stream)
    }
  })

  return stream
}

function autoEnd (stream) {
  stream.end()
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
