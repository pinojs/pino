global.process = { __proto__: process, pid: 123456 }
Date.now = function () { return 1459875739796 }
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../../'))
var log = pino({
  prettyPrint: true,
  serializers: {
    foo (obj) {
      if (obj.an !== 'object') {
        throw new Error('kaboom')
      }

      return 'bar'
    }
  }
})
var child = log.child({ foo: { an: 'object' } })
child.info('h')
