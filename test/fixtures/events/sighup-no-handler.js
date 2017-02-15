'use strict'

// we need stable data to run our tests
global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }

var pino = require(require.resolve('./../../../'))

if (process.listenerCount('SIGHUP') > 0) {
  // needed because of a hook added by code coverage
  process.removeAllListeners('SIGHUP')
}

// extreme mode
var log = pino({extreme: true})
log.info('h')

function foo () {
  setTimeout(foo, 50)
}
foo()
