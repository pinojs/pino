global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../../'))
var log = pino({extreme: true})
log.info('h')

process.on('SIGHUP', function () {
  console.log('app sighup')
  process.exit(0)
})

function foo () {
  setTimeout(foo, 50)
}
foo()
