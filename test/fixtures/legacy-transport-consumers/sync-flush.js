const pino = require('./../../..')
const tp = pino.transport('legacy-transport')
const instance = pino(tp)
instance.info('hello')
process.on('exit', () => {
  tp.flushSync()
})
