'use strict'

// we need stable data to run our tests
global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }

var pino = require(require.resolve('./../../../'))

// use a destination
var log = pino(pino.destination())
log.info('h')
