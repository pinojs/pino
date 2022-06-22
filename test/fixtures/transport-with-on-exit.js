'use strict'
const pino = require('../..')
const log = pino({
  transport: {
    target: 'pino/file',
    options: { destination: '/dev/null' }
  }
})
log.info('hello world!')
process.on('exit', (code) => {
  log.info('Exiting peacefully')
})
