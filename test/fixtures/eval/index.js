/* eslint-disable no-eval */

eval(`
const pino = require('../../../')

const logger = pino(
  pino.transport({
    target: 'pino-pretty'
  })
)

logger.info('done!')
`)
