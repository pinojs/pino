global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../'))
var dest = pino.extreme(1)
var logger = pino({}, dest)
logger.info('hello')
logger.info('world')
dest.flushSync()
process.exit(0)
