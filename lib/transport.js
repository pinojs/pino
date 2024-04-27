'use strict'

const { createRequire } = require('module')
const getCallers = require('./caller')
const { join, isAbsolute, sep } = require('path')
const sleep = require('atomic-sleep')
const onExit = require('on-exit-leak-free')
const ThreadStream = require('thread-stream')

function setupOnExit (stream) {
  // This is leak free, it does not leave event handlers
  onExit.register(stream, autoEnd)
  onExit.registerBeforeExit(stream, flush)

  stream.on('close', function () {
    onExit.unregister(stream)
  })
}

function buildStream (filename, workerData, workerOpts) {
  const stream = new ThreadStream({
    filename,
    workerData,
    workerOpts
  })

  stream.on('ready', onReady)
  stream.on('close', function () {
    process.removeListener('exit', onExit)
  })

  process.on('exit', onExit)

  function onReady () {
    process.removeListener('exit', onExit)
    stream.unref()

    if (workerOpts.autoEnd !== false) {
      setupOnExit(stream)
    }
  }

  function onExit () {
    /* istanbul ignore next */
    if (stream.closed) {
      return
    }
    stream.flushSync()
    // Apparently there is a very sporadic race condition
    // that in certain OS would prevent the messages to be flushed
    // because the thread might not have been created still.
    // Unfortunately we need to sleep(100) in this case.
    sleep(100)
    stream.end()
  }

  return stream
}

function autoEnd (stream) {
  stream.ref()
  stream.flushSync()
  stream.end()
  stream.once('close', function () {
    stream.unref()
  })
}

function flush (stream) {
  stream.flushSync()
}

function transport (fullOptions) {
  const { pipeline, pipelines, targets, levels, dedupe, options = {}, worker = {}, caller = getCallers() } = fullOptions

  // Backwards compatibility
  const callers = typeof caller === 'string' ? [caller] : caller

  // This will be eventually modified by bundlers
  const bundlerOverrides = '__bundlerPathsOverrides' in globalThis ? globalThis.__bundlerPathsOverrides : {}

  let target = fullOptions.target

  if (target && targets) {
    throw new Error('only one of target or targets can be specified')
  }

  // Avoid having to deal with combinatorial explosion of cases to handle
  if (pipeline && pipelines) {
    throw new Error('only one of pipeline or pipelines can be specified')
  }

  if (targets) {
    target = bundlerOverrides['pino-worker'] || join(__dirname, 'worker.js')
    options.targets = targets
      .map((dest) => {
        return {
          ...dest,
          target: fixTarget(dest.target)
        }
      })
  }

  /**
   * In case 'pipelines' property is defined
   */
  if (pipelines) {
    target = bundlerOverrides['pino-pipeline-worker'] || join(__dirname, 'worker-pipeline.js')

    // Prepare the different pipelines
    options.pipelines = []

    const pipelineTargets = {}
    for (const pKey in pipelines) {
      pipelineTargets[pKey] = pipelines[pKey].map(p => {
        return { target: fixTarget(p.target) }
      })
    }

    // We wrap each target to be a logical pipeline and
    // match with an actual pipeline, if target.pipeline is defined
    options.targets.forEach((t) => {
      if (t.pipeline) {
        const pipeline = pipelineTargets[t.pipeline]
        // Build an array of targets of the form:
        // [{target: transform1}, .. {target: transformN}, {target: destinationStream}]
        options.pipelines.push(pipeline.concat(t))
      } else {
        // [{target: destinationStream}]
        options.pipelines.push([t])
      }
    })

    // Signal for the worker
    options.targets = undefined
  } else if (pipeline) {
    target = bundlerOverrides['pino-pipeline-worker'] || join(__dirname, 'worker-pipeline.js')
    options.targets = pipeline.map((dest) => {
      return {
        ...dest,
        target: fixTarget(dest.target)
      }
    })
  }

  if (levels) {
    options.levels = levels
  }

  if (dedupe) {
    options.dedupe = dedupe
  }

  options.pinoWillSendConfig = true

  return buildStream(fixTarget(target), options, worker)

  function fixTarget (origin) {
    origin = bundlerOverrides[origin] || origin

    if (isAbsolute(origin) || origin.indexOf('file://') === 0) {
      return origin
    }

    if (origin === 'pino/file') {
      return join(__dirname, '..', 'file.js')
    }

    let fixTarget

    for (const filePath of callers) {
      try {
        const context = filePath === 'node:repl'
          ? process.cwd() + sep
          : filePath

        fixTarget = createRequire(context).resolve(origin)
        break
      } catch (err) {
        // Silent catch
        continue
      }
    }

    if (!fixTarget) {
      throw new Error(`unable to determine transport target for "${origin}"`)
    }

    return fixTarget
  }
}

module.exports = transport
