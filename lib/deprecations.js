'use strict'

const warning = require('fastify-warning')()
module.exports = warning

const warnName = 'PinoWarning'

warning.create(warnName, 'PINODEP008', 'prettyPrint: true is deprecated, use `prettyPrint: require(\'pino-pretty\')` or pino.transport() instead.')
