'use strict'

const pinoPretty = require('pino-pretty')
const { Transform, pipeline } = require('stream')
const pino = require('../pino')
const { once } = require('events')

module.exports = async function (/* istanbul ignore next */ opts = {}) {
  const pretty = pinoPretty(opts)
  const stream = new Transform({
    objectMode: true,
    autoDestroy: true,
    transform (chunk, enc, cb) {
      const line = pretty(chunk.toString())
      cb(null, line)
    }
  })

  // TODO figure out why sync: false does not work here
  // TODO remove the istanbul ignore, add a test using a
  // child_process
  const destination = pino.destination(opts.destination || /* istanbul ignore next */ 1)
  /* istanbul ignore next */
  if (destination.fd === 1) {
    destination.end = function () {
      this.emit('close')
    }
  }
  await once(destination, 'ready')
  pipeline(stream, destination, () => {})
  return stream
}
