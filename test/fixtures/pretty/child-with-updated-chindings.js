global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
const pino = require(require.resolve('./../../../'))
const log = pino({ prettyPrint: require('pino-pretty') }).child({ foo: 123 })
log.info('before')
log.setBindings({ foo: 456, bar: 789 })
log.info('after')
