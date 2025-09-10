'use strict'

const diagChan = require('node:diagnostics_channel')

module.exports = {
  asJsonChan: diagChan.tracingChannel('pino_asJson')
}
