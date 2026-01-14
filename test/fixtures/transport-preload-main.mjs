'use strict'

// This is the main script that runs after the preload
// It imports the logger from the preload and logs a message

import { log } from './transport-preload.mjs'

log.info('hello from main')

// Wait a bit for the transport to flush
setTimeout(() => {
  process.exit(0)
}, 500)
