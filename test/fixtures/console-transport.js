const { Writable } = require('stream')

module.exports = (options) => {
  const myTransportStream = new Writable({
    write (chunk, enc, cb) {
      // apply a transform and send to stdout
      console.log(chunk.toString().toUpperCase())
      cb()
    }
  })
  return myTransportStream
}
