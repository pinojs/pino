'use strict'

const build = require('pino-abstract-transport')
const { pipeline, Transform } = require('node:stream')

// Receives the per-stage `worker.workerData`
// (see https://github.com/pinojs/pino/issues/1856) as the second argument.
module.exports = (options, workerData = {}) => {
  const { port, value } = workerData

  if (port) {
    port.postMessage({ value })
    port.close()
  }

  return build(function (source) {
    const stream = new Transform({
      autoDestroy: true,
      objectMode: true,
      transform (chunk, enc, cb) {
        if (value !== undefined) {
          chunk.workerValue = value
        }
        this.push(JSON.stringify(chunk))
        cb()
      }
    })
    pipeline(source, stream, () => {})
    return stream
  }, {
    enablePipelining: true
  })
}
