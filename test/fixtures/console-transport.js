const { Writable } = require('stream')
const { pass } = require('tap')

module.exports = (options) => {
  const myTransportStream = new Writable({
    write (chunk, enc, cb) {
      // apply a transform and send to stdout
      console.log(chunk.toString().toUpperCase())
      pass()
      cb()
    }
  })
  return myTransportStream
}
