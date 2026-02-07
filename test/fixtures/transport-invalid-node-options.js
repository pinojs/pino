'use strict'

const pino = require('../../')
const { join } = require('node:path')

const destination = process.argv[2]

process.env.NODE_OPTIONS = `--require ${join(__dirname, 'this-file-does-not-exist.js')}`

const transport = pino.transport({
  target: join(__dirname, 'to-file-transport.js'),
  options: { destination }
})

const logger = pino(transport)
transport.on('ready', () => {
  logger.info('hello with invalid node options preload')
  setTimeout(() => {
    transport.end()
  }, 50)
})

transport.on('error', (err) => {
  process.stderr.write(`${err.stack}\n`)
  process.exitCode = 1
})
