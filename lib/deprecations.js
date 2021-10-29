'use strict'

const warning = require('fastify-warning')()
module.exports = warning

const warnName = 'PinoWarning'

warning.create(warnName, 'PINODEP008', 'prettyPrint is deprecated, use the pino-pretty transport instead')

warning.create(warnName, 'PINODEP009', 'The use of pino.final is discouraged in Node.js v14+ and not required. It will be removed in the next major version')

warning.create(warnName, 'PINODEP010', 'Your Node.js version is outdated. You need to upgrade a newer Node.js version')
