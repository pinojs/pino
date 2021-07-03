'use strict'

const { Transform, pipeline } = require('stream')
const pino = require('../pino')
const { once } = require('events')

module.exports = async function (opts = {}) {
  const stream = new Transform({
    objectMode: true,
    autoDestroy: true,
    transform (chunk, enc, cb) {
      cb(null, chunk.toString())
    }
  })

  const destination = pino.destination({ dest: opts.destination || 1, sync: false })
  await once(destination, 'ready')
  pipeline(stream, destination, () => {})
  return stream
}
