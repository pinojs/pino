'use strict'

const { createRequire } = require('module')
const getCaller = require('get-caller-file')
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
    process.once('beforeExit', fn)
    process.once('exit', fn)

    stream.on('close', function () {
      process.removeListener('beforeExit', fn)
      process.removeListener('exit', fn)
    })
  }
}

function buildStream (filename, workerData, workerOpts) {
  const stream = new ThreadStream({
    filename,
    workerData,
    workerOpts
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
  stream.ref()
  stream.end()
  stream.once('close', function () {
    stream.unref()
  })
}

function transport (fullOptions) {
  const { pipeline, targets, options = {}, worker = {}, caller = getCaller() } = fullOptions
  // This function call MUST stay in the top-level function of this module
  const callerRequire = createRequire(caller)

  let target = fullOptions.target

  if (target && targets) {
    throw new Error('only one of target or targets can be specified')
  }

  if (targets) {
    target = join(__dirname, 'worker.js')
    options.targets = targets.map((dest) => {
      return {
        ...dest,
        target: fixTarget(dest.target)
      }
    })
  } else if (fullOptions.pipeline) {
    target = join(__dirname, 'worker-pipeline.js')
    options.targets = pipeline.map((dest) => {
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
      // This hack should not be needed, however it would not work otherwise
      // when testing it from this module and in examples.
      case 'pino/file':
        return join(__dirname, '..', 'file.js')
      /* istanbul ignore next */
      default:
        // TODO we cannot test this on Windows.. might not work.
        return callerRequire.resolve(origin)
    }
  }
}

module.exports = transport
