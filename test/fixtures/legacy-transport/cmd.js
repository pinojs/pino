'use strict'
const { Transform } = require('stream')
const transform = new Transform({
  transform (chunk, enc, cb) {
    const { level, msg } = JSON.parse(chunk)
    cb(null, `${level}:${msg}`)
  }
})
process.stdin.pipe(transform)
transform.pipe(process.stdout)
