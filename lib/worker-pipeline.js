'use strict'

const EE = require('events')
const loadTransportStreamBuilder = require('./transport-stream')
const { pipeline, PassThrough } = require('stream')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

module.exports = async function ({ targets }) {
  const streams = await Promise.all(targets.map(async (t) => {
    const fn = await loadTransportStreamBuilder(t.target)
    const stream = await fn(t.options)
    return stream
  }))
  const ee = new EE()

  const stream = new PassThrough({
    autoDestroy: true,
    destroy (_, cb) {
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
