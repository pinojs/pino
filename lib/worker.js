'use strict'

const pino = require('../pino.js')
const { Transform, pipeline } = require('stream')
const build = require('pino-abstract-transport')
const { once } = require('events')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

module.exports = async function ({ destinations }) {
  destinations = await Promise.all(destinations.map(async (t) => {
    let stream
    if (t.src) {
      const toLoad = 'file://' + t.src
      stream = await (await import(toLoad)).default(t.opts)
    } else if (t.prettyPrint) {
      const pretty = require('pino-pretty')(t.prettyPrint)
      stream = new Transform({
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
      const destination = pino.destination(t.destination || /* istanbul ignore next */ 1)
      /* istanbul ignore next */
      if (destination.fd === 1) {
        destination.end = function () {
          this.emit('close')
        }
      }
      await once(destination, 'ready')
      pipeline(stream, destination, () => {})
    } else {
      // TODO remove the transform
      stream = new Transform({
        objectMode: true,
        autoDestroy: true,
        transform (chunk, enc, cb) {
          cb(null, chunk.toString() + '\n')
        }
      })

      // TODO figure out why sync: false does not work here
      const destination = pino.destination(t.destination || /* istanbul ignore next */ 1)
      await once(destination, 'ready')
      pipeline(stream, destination, () => {})
    }
    return {
      level: t.level,
      stream
    }
  }))
  return build(process, {
    parse: 'lines',
    metadata: true,
    close (err, cb) {
      let expected = 0
      for (const transport of destinations) {
        expected++
        transport.stream.on('close', closeCb)
        transport.stream.end()
      }

      function closeCb () {
        if (--expected === 0) {
          cb(err)
        }
      }
    }
  })

  function process (stream) {
    const multi = pino.multistream(destinations)
    // TODO manage backpressure
    stream.on('data', function (chunk) {
      const { lastTime, lastMsg, lastObj, lastLevel } = this
      multi.lastLevel = lastLevel
      multi.lastTime = lastTime
      multi.lastMsg = lastMsg
      multi.lastObj = lastObj

      // TODO handle backpressure
      multi.write(chunk + '\n')
    })
  }
}
