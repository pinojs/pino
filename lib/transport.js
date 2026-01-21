'use strict'

const { createRequire } = require('module')
const getCallers = require('./caller')
const { join, isAbsolute, sep } = require('node:path')
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

// Check if preload flags exist in execArgv.
// During preload phase (require.main undefined), we pass empty execArgv to prevent infinite worker spawning.
// We don't try to filter and pass other flags because many (like --stack-trace-limit, --tls-cipher-list)
// aren't valid for worker threads and would cause ERR_WORKER_INVALID_EXEC_ARGV.
function hasPreloadFlags () {
  const execArgv = process.execArgv
  for (let i = 0; i < execArgv.length; i++) {
    const arg = execArgv[i]
    if (arg === '--import' || arg === '--require' || arg === '-r') {
      return true
    }
    if (arg.startsWith('--import=') || arg.startsWith('--require=') || arg.startsWith('-r=')) {
      return true
    }
  }
  return false
}

function buildStream (filename, workerData, workerOpts, sync, name) {
  // When pino is loaded during a preload phase (via --import or --require),
  // pass empty execArgv to prevent infinite spawning. Each worker would
  // otherwise re-run the preload, creating another transport.
  if (!workerOpts.execArgv && hasPreloadFlags() && require.main === undefined) {
    workerOpts = {
      ...workerOpts,
      execArgv: []
    }
  }

  workerOpts = { ...workerOpts, name }

  const stream = new ThreadStream({
    filename,
    workerData,
    workerOpts,
    sync
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
  const { pipeline, targets, levels, dedupe, worker = {}, caller = getCallers(), sync = false } = fullOptions

  const options = {
    ...fullOptions.options
  }

  // Backwards compatibility
  const callers = typeof caller === 'string' ? [caller] : caller

  // This will be eventually modified by bundlers
  const bundlerOverrides = (typeof globalThis === 'object' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__bundlerPathsOverrides') &&
    globalThis.__bundlerPathsOverrides &&
    typeof globalThis.__bundlerPathsOverrides === 'object')
    ? globalThis.__bundlerPathsOverrides
    : Object.create(null)

  let target = fullOptions.target

  if (target && targets) {
    throw new Error('only one of target or targets can be specified')
  }

  if (targets) {
    target = bundlerOverrides['pino-worker'] || join(__dirname, 'worker.js')
    options.targets = targets.filter(dest => dest.target).map((dest) => {
      return {
        ...dest,
        target: fixTarget(dest.target)
      }
    })
    options.pipelines = targets.filter(dest => dest.pipeline).map((dest) => {
      return dest.pipeline.map((t) => {
        return {
          ...t,
          level: dest.level, // duplicate the pipeline `level` property defined in the upper level
          target: fixTarget(t.target)
        }
      })
    })
  } else if (pipeline) {
    target = bundlerOverrides['pino-worker'] || join(__dirname, 'worker.js')
    options.pipelines = [pipeline.map((dest) => {
      return {
        ...dest,
        target: fixTarget(dest.target)
      }
    })]
  }

  if (levels) {
    options.levels = levels
  }

  if (dedupe) {
    options.dedupe = dedupe
  }

  options.pinoWillSendConfig = true

  const name = (targets || pipeline) ? 'pino.transport' : target
  return buildStream(fixTarget(target), options, worker, sync, name)

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
