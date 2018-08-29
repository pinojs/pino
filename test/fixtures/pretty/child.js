global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../../'))
var log = pino({ prettyPrint: true }).child({ a: 1 })
log.info('h')
log.child({ b: 2 }).info('h3')
setTimeout(() => log.info('h2'), 200)
