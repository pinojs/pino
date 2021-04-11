'use strict'

const transport = require('../transport')
const { join } = require('path')

module.exports = function multitransport (definitions, workerOpts) {
  return transport(join(__dirname, 'worker.js'), definitions, workerOpts)
}
