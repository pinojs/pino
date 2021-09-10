'use strict'

const warning = require('fastify-warning')()
module.exports = warning

const warnName = 'PinoWarning'

warning.create(warnName, 'PINODEP008', 'prettyPrint is deprecated, use the pino-pretty transport instead')
