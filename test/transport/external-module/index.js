'use strict'

const pino = require('pino')
const path = require('path')

module.exports = function getLogger (config, relativeDir = __dirname) {
  if (!config) {
    config = {
      transport: {
        target: path.join(__dirname, 'local-transport.js'),
        options: { destination: path.join(relativeDir, 'module-config.log') }
      }
    }
  }

  return pino(config)
}
