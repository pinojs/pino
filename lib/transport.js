'use strict'

const { Worker } = require('worker_threads')

function transport (filePath, args = []) {
  args.unshift(filePath)
  const code = `
    process.stdin.fd = 1
    process.argv.push(...${JSON.stringify(args)})
    require('${filePath}')
  `
  const worker = new Worker(code, {
    eval: true,
    stdin: true
  })
  return worker.stdin
}

module.exports = transport
