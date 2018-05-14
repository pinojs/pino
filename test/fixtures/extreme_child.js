global.process = { __proto__: process, pid: 123456 }
global.Date = class extends Date {
  constructor (...args) {
    args[0] = 1459875739000
    super(...args)
  }
  static now () {
    return 1459875739000
  }
}
require('os').hostname = function () { return 'abcdefghijklmnopqr' }
var pino = require(require.resolve('./../../'))
var extreme = pino(pino.extreme()).child({ hello: 'world' })
extreme.info('h')
