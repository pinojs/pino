const pino = require('../../../../pino')

// The destination of the log file. Can be `undefined`.
const destFile = process.env.LOG_FILE
const jsonLog = process.env.JSON_LOG
const logLevel = process.env.LOG_LEVEL

const targetCommonOptions = {
  level: logLevel ?? 'info'
}

const transport = pino.transport({
  targets: [
    jsonLog !== 'true' && {
      target: 'pino-pretty',
      options: {
        colorize: true,
        messageFormat: '\x1b[1m\x1b[32m({scope})\x1b[0m\x1b[36m {msg}',
        ignore: 'time,pid,hostname,scope',
        errorProps: '*'
      },
      ...targetCommonOptions
    },
    (destFile || jsonLog === 'true') && {
      target: 'pino/file',
      options: { destination: destFile || 1 },
      ...targetCommonOptions
    }
  ].filter((v) => v)
})

const logger = pino(targetCommonOptions, transport)

logger.info('foo')
