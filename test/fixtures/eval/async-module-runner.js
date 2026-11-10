'use strict'

const pino = require('../../../')
const AsyncFunction = (async () => {}).constructor

;(async () => {
  await new AsyncFunction('pino', `
    await null
    const logger = pino(
      pino.transport({
        target: 'dummy-transport'
      })
    )
    logger.info('done!')
  `)(pino)
})().then(() => {
  console.log('done!')
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
