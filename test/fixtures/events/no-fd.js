global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var stream = require('stream')
var dest = new stream.PassThrough()
dest.pipe(process.stdout)
var pino = require(require.resolve('./../../../'))
var log = pino({extreme: true}, dest)
log.info('h')
