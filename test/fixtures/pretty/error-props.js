global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
const pino = require(require.resolve('./../../../'))
const log = pino({
  prettyPrint: {
    errorProps: 'code,errno'
  },
  prettifier: require('pino-pretty')
})
const err = Object.assign(new Error('kaboom'), { code: 'ENOENT', errno: 1 })
log.error(err)
