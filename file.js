'use strict'

const pino = require('./pino')
const { once } = require('events')

module.exports = async function (opts = {}) {
  const destOpts = { dest: opts.destination || 1, sync: false }
  if (opts.append === false) destOpts.append = false
  if (opts.mkdir) destOpts.mkdir = true
  const destination = pino.destination(destOpts)
  await once(destination, 'ready')
  return destination
}
