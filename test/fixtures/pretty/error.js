global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
const pino = require(require.resolve('./../../../'))
const log = pino({ prettyPrint: require('pino-pretty') })
log.error(new Error('kaboom'))
log.error(new Error('kaboom'), 'with a message')
