import { StreamEntry, pino } from '../../pino'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import pinoPretty from 'pino-pretty'

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
logger.setBindings({ some: 'bindings' })
logger.info('test2')
logger.flush()

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

// custom levels

const customLevels = {
    debug   : 1,
    info    : 2,
    network : 3,
    error   : 4,
};

type CustomLevels = keyof typeof customLevels;

const pinoOpts = {
    level: 'debug',
    useOnlyCustomLevels: true,
    customLevels: customLevels,
};

const multistreamOpts = {
    dedupe: true,
    levels: customLevels
};

const streams: StreamEntry<CustomLevels>[] = [
    { level : 'debug',   stream : pinoPretty() },
    { level : 'info',    stream : pinoPretty() },
    { level : 'network', stream : pinoPretty() },
    { level : 'error',   stream : pinoPretty() },
];

const loggerCustomLevel = pino(pinoOpts, pino.multistream(streams, multistreamOpts));
loggerCustomLevel.debug('test3')
loggerCustomLevel.info('test4')
loggerCustomLevel.error('test5')
loggerCustomLevel.network('test6')
