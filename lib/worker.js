'use strict'

const pino = require('../pino.js')
const { Transform, pipeline } = require('stream')
const build = require('pino-abstract-transport')
const { once } = require('events')

// This file is not checked by the code coverage tool

module.exports = async function (transports) {
  transports = await Promise.all(transports.map(async (t) => {
    let stream
    if (t.module) {
      stream = await (await import(t.module)).default(t.opts)
    } else if (t.prettyPrint) {
      const pretty = require('pino-pretty')(t.prettyPrint)
      stream = new Transform({
        objectMode: true,
        transform (chunk, enc, cb) {
          const line = pretty(chunk.toString())
          if (line === undefined) return cb()
          cb(null, line)
        }
      })

      // TODO figure out why sync: false does not work here
      const destination = pino.destination(t.destination || 0)
      await once(destination, 'ready')
      pipeline(stream, destination, () => {})
    } else {
      // TODO remove the transform
      stream = new Transform({
        objectMode: true,
        transform (chunk, enc, cb) {
          cb(null, chunk.toString() + '\n')
        }
      })

      // TODO figure out why sync: false does not work here
      const destination = pino.destination(t.destination || 0)
      await once(destination, 'ready')
      pipeline(stream, destination, () => {})
    }
    return {
      level: t.level,
      stream
    }
  }))
  return build(process, { parse: 'lines', metadata: true })

  function process (stream) {
    const multi = pino.multistream(transports)
    // TODO manage backpressure
    stream.on('data', function (chunk) {
      const { lastTime, lastMsg, lastObj, lastLevel } = this
      multi.lastLevel = lastLevel
      multi.lastTime = lastTime
      multi.lastMsg = lastMsg
      multi.lastObj = lastObj

      // TODO handle backpressure
      multi.write(chunk)
    })

    stream.on('end', function () {
      for (const transport of transports) {
        transport.stream.end()
      }
    })
  }
}
