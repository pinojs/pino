global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../../'))
var log = pino({
  extreme: true,
  onTerminated: function (evt, err) {
    console.error(err.message)
    console.log('terminated')
    process.exit()
  }
})
log.info('h')

setTimeout(function () { throw Error('this is not caught') }, 500)
