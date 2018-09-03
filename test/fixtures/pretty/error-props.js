global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../../'))
var log = pino({
  prettyPrint: { errorProps: 'code,errno' }
})
var err = Object.assign(new Error('kaboom'), { code: 'ENOENT', errno: 1 })
log.error(err)
