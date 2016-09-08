global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../'))
var extreme = pino({extreme: true}).child({ hello: 'world' })
extreme.info('h')
