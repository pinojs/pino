global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../'))
var asyncLogger = pino(pino.destination({ minLength: 4096, sync: false }))
pino.final(asyncLogger, (_, logger) => logger.info('h'))()
