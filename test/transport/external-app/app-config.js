'use strict'

const path = require('path')
const moduleExternal = require('external')

const logger = moduleExternal({
  transport: {
    target: path.join(__dirname, 'local-transport-app.js'),
    options: { destination: path.join(__dirname, 'app-config.log') }
  }
})
logger.info('hello world, it works with custom config!')
