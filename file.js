'use strict'

const pino = require('./pino')
const { once } = require('events')

module.exports = async function (opts = {}) {
  const destination = pino.destination({ dest: opts.destination || 1, sync: false })
  await once(destination, 'ready')
  return destination
}
