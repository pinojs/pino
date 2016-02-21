'use strict'

var pino = require('./')()
var info = pino.info

info('hello world')
info('the answer is %d', 42)
info({ obj: 42 }, 'hello world')
setImmediate(info, 'after setImmediate')
