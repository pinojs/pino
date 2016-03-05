'use strict'

var pino = require('./')()
var info = pino.info
var error = pino.error

info('hello world')
error('this is at error level')
info('the answer is %d', 42)
info({ obj: 42 }, 'hello world')
info({ obj: 42, b: 2 }, 'hello world')
info({ obj: { aa: 'bbb' } }, 'another')
setImmediate(info, 'after setImmediate')
error(new Error('an error'))
