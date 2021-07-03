'use strict'

const pinoPretty = require('pino-pretty')
const { Transform, pipeline } = require('stream')
const pino = require('../pino')
const { once } = require('events')

module.exports = async function (opts = {}) {
  const pretty = pinoPretty(opts)
  const stream = new Transform({
    objectMode: true,
    autoDestroy: true,
    transform (chunk, enc, cb) {
      const line = pretty(chunk.toString())
      cb(null, line)
    }
  })

  const destination = pino.destination({ dest: opts.destination || 1, sync: false })
  if (destination.fd === 1) {
    // We cannot close the output
    destination.end = function () {
      this.emit('close')
    }
  }
  await once(destination, 'ready')
  pipeline(stream, destination, () => {})
  return stream
}
