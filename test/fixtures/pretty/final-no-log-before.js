global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
const pino = require(require.resolve('./../../../'))
const log = pino({ prettyPrint: require('pino-pretty') })
process.once('beforeExit', pino.final(log, (_, logger) => {
  logger.info('beforeExit')
}))
