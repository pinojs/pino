'use strict'

const build = require('pino-abstract-transport')
const { pipeline, Transform } = require('node:stream')

module.exports = (options) => {
  const { port, value } = options.workerData
  port.postMessage({ value })
  port.close()

  return build(function (source) {
    const stream = new Transform({
      autoDestroy: true,
      objectMode: true,
      transform (chunk, enc, cb) {
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
