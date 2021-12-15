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
      fn = (await realImport(toLoad)).default
    } catch (error) {
      // See this PR for details: https://github.com/pinojs/thread-stream/pull/34
      if ((error.code === 'ENOTDIR' || error.code === 'ERR_MODULE_NOT_FOUND')) {
        fn = realRequire(t.target)
      } else {
        throw error
      }
    }
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
