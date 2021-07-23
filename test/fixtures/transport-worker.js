'use strict'

const { Writable } = require('stream')
module.exports = (options) => {
  const myTransportStream = new Writable({
    write (chunk, enc, cb) {
      console.log(chunk.toString())
      cb()
    }
  })
  return myTransportStream
}
