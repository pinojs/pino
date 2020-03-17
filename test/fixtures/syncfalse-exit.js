global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../'))
var dest = pino.destination({ dest: 1, minLength: 4096, sync: false })
var logger = pino({}, dest)
logger.info('hello')
logger.info('world')
process.exit(0)
