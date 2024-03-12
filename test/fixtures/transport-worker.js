'use strict'

const { Writable } = require('stream')
const fs = require('fs')
module.exports = (options) => {
  const myTransportStream = new Writable({
    autoDestroy: true,
    write (chunk, enc, cb) {
      // Bypass console.log() to avoid flakyness
      fs.writeSync(1, chunk.toString())
      cb()
    }
  })
  return myTransportStream
}
