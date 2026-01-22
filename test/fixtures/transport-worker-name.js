'use strict'

const { parentPort, threadName } = require('worker_threads')
const { Writable } = require('node:stream')

let sent = false

module.exports = (options) => {
  const myTransportStream = new Writable({
    autoDestroy: true,
    write (chunk, enc, cb) {
      if (!sent) {
        sent = true
        parentPort.postMessage({
          code: 'EVENT',
          name: 'workerThreadName',
          args: [threadName]
        })
      }
      cb()
    }
  })
  return myTransportStream
}
