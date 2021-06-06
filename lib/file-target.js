'use strict'

const { Transform, pipeline } = require('stream')
const pino = require('../pino')
const { once } = require('events')

module.exports = async function (opts) {
  // TODO remove the transform
  const stream = new Transform({
    objectMode: true,
    autoDestroy: true,
    transform (chunk, enc, cb) {
      cb(null, chunk.toString())
    }
  })

  // TODO figure out why sync: false does not work here
  const destination = pino.destination(opts.destination || /* istanbul ignore next */ 1)
  await once(destination, 'ready')
  pipeline(stream, destination, () => {})
  return stream
}
