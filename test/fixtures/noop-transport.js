const { Writable } = require('stream')

module.exports = () => {
  return new Writable({
    autoDestroy: true,
    write (chunk, enc, cb) {
      cb()
    }
  })
}
