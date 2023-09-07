'use strict'

const pino = require('../pino.js')
const build = require('pino-abstract-transport')
const loadTransportStreamBuilder = require('./transport-stream')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

module.exports = async function ({ targets, levels, dedupe }) {
  targets = await Promise.all(targets.map(async (t) => {
    const fn = await loadTransportStreamBuilder(t.target)
    const stream = await fn(t.options)
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
      for (const transport of targets) {
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
    const multi = pino.multistream(targets, { levels, dedupe })
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
