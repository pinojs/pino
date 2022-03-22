'use strict'

const EE = require('events')
const { realImport, realRequire } = require('real-require')
const { pipeline, PassThrough } = require('stream')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

module.exports = async function ({ targets }) {
  const streams = await Promise.all(targets.map(async (t) => {
    let fn
    try {
      const toLoad = 'file://' + t.target

      if (toLoad.endsWith('.ts') || toLoad.endsWith('.cts')) {
        // TODO: add support for the TSM modules loader ( https://github.com/lukeed/tsm ).
        if (process[Symbol.for('ts-node.register.instance')]) {
          realRequire('ts-node/register')
        } else if (process.env?.TS_NODE_DEV) {
          realRequire('ts-node-dev')
        }
        // TODO: Support ES imports once tsc, tap & ts-node provide better compatibility guarantees.
        fn = realRequire(decodeURIComponent(t.target))
      } else {
        fn = (await realImport(toLoad))
      }
    } catch (error) {
      // See this PR for details: https://github.com/pinojs/thread-stream/pull/34
      if ((error.code === 'ENOTDIR' || error.code === 'ERR_MODULE_NOT_FOUND')) {
        fn = realRequire(t.target)
      } else {
        throw error
      }
    }

    // Depending on how the default export is performed, and on how the code is
    // transpiled, we may find cases of two nested "default" objects.
    // See https://github.com/pinojs/pino/issues/1243#issuecomment-982774762
    if (typeof fn === 'object') fn = fn.default
    if (typeof fn === 'object') fn = fn.default

    const stream = await fn(t.options)
    return stream
  }))
  const ee = new EE()

  const stream = new PassThrough({
    autoDestroy: true,
    destroy (err, cb) {
      // destroying one stream is enough
      streams[0].destroy(err)
      ee.on('error', cb)
      ee.on('closed', cb)
    }
  })

  pipeline(stream, ...streams, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      ee.emit('error', err)
      return
    }

    ee.emit('closed')
  })

  return stream
}
