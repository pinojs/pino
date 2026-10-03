'use strict'

const pino = require('../../../')

// Mimics Vite's SSR module runner
const AsyncFunction = (async () => {}).constructor
const run = new AsyncFunction('pino', `
  await null

  const logger = pino(
    pino.transport({
      target: 'pino-pretty',
      options: { colorize: false }
    })
  )

  logger.info('done!')
`)

async function main () {
  await run(pino)
}

main()
