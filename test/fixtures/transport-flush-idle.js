'use strict'

const fs = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')
const pino = require('../..')

const dest = join(tmpdir(), `pino-flush-idle-${process.pid}.log`)
fs.writeFileSync(dest, '')

const transport = pino.transport({
  target: 'pino/file',
  options: { destination: dest }
})

const logger = pino(transport)
logger.info({ marker: 'first-log' })

let callbackFired = false
logger.flush((err) => {
  callbackFired = true
  if (err) {
    console.error(err)
    process.exitCode = 1
    return
  }
  console.log('callback-fired')
})

process.on('exit', () => {
  if (!callbackFired) {
    console.error('callback-missing')
  }
})
