import { pino } from '../../pino'
import { join } from 'path'
import { tmpdir } from'os'

const destination = join(
    tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
)

// Single
const transport = pino.transport({
    target: 'pino-pretty',
    options: { some: 'options for', the: 'transport' }
})
const logger = pino(transport)
logger.info('test2')

const transport2 = pino.transport({
    target: 'pino-pretty',
})
const logger2 = pino(transport2)
logger2.info('test2')


// Multiple

const transports = pino.transport({targets: [
    {
        level: 'info',
        target: 'pino-pretty',
        options: { some: 'options for', the: 'transport' }
    },
    {
        level: 'trace',
        target: 'pino/file',
        options: { destination }
    }
]})
const loggerMulti = pino(transports)
loggerMulti.info('test2')
