const pino = require('./../../..')
const instance = pino(pino.transport('legacy-transport'))
instance.info('hello')
setTimeout(() => {}, 100) // breathing time
