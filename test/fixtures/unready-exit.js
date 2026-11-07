'use strict'
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')
const pino = require('../../')

const tmpFile = path.join(os.tmpdir(), `pino-unready-exit-${process.pid}.log`)
const dest = pino.destination({ dest: tmpFile, sync: false })
const logger = pino(dest)
logger.info('hello')

process.on('exit', () => {
  try {
    fs.unlinkSync(tmpFile)
  } catch {}
})

process.exit(0)
