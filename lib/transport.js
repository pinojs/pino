'use strict'

const { Worker } = require('worker_threads')

function transport (name, args = []) {
  const filename = require.resolve(name)
  const worker = new Worker(filename, {
    execArgv: args,
    stdin: true
  })
  return worker.stdin
}

module.exports = transport
