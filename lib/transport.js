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

// Detect preload flags and filter them out in one pass.
// Returns { hasPreload, execArgv } where execArgv has preload flags removed.
// During preload phase (require.main undefined), we filter to prevent infinite worker spawning.
function processPreloadFlags () {
  const execArgv = process.execArgv
  let hasPreload = false
  const filtered = []

  for (let i = 0; i < execArgv.length; i++) {
    const arg = execArgv[i]
    if (arg === '--import' || arg === '--require' || arg === '-r') {
      hasPreload = true
      i++ // skip the next arg (the module path)
      continue
    }
    if (arg.startsWith('--import=') || arg.startsWith('--require=') || arg.startsWith('-r=')) {
      hasPreload = true
      continue
    }
    filtered.push(arg)
  }

  return { hasPreload, filtered }
}

function buildStream (filename, workerData, workerOpts, sync) {
  // When pino is loaded during a preload phase (via --import or --require),
  // filter out preload flags from worker's execArgv to prevent infinite spawning.
  // Each worker would otherwise re-run the preload, creating another transport.
  if (!workerOpts.execArgv) {
    const { hasPreload, filtered } = processPreloadFlags()
    if (hasPreload && require.main === undefined) {
      workerOpts = {
        ...workerOpts,
        execArgv: filtered
      }
    }
  }

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

  return buildStream(fixTarget(target), options, worker, sync)

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
