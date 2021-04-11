'use strict'

const pino = require('../../pino.js')
const build = require('pino-abstract-transport')

module.exports = async function ({ transports }) {
  transports = await Promise.all(transports.map(async (t) => {
    const stream = await (await import(t.module)).default(t.opts)
    return {
      level: t.level,
      stream
    }
  }))
  return build(process, { parse: 'lines', metadata: true })

  function process (stream) {
    const multi = pino.multistream(transports)
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
