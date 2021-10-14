import { expectType } from 'tsd'

import { createWriteStream } from 'fs'

import pino from '../../pino'

const streams = [
  { stream: process.stdout },
  { stream: createWriteStream('') },
  { level: 'error' as const, stream: process.stderr },
  { level: 'fatal' as const, stream: createWriteStream('') }
]

expectType<pino.MultiStreamRes>(pino.multistream(process.stdout))
expectType<pino.MultiStreamRes>(pino.multistream([createWriteStream('')]))
expectType<pino.MultiStreamRes>(pino.multistream({ level: 'error' as const, stream: process.stderr }))
expectType<pino.MultiStreamRes>(pino.multistream([{ level: 'fatal' as const, stream: createWriteStream('') }]))

expectType<pino.MultiStreamRes>(pino.multistream(streams))
expectType<pino.MultiStreamRes>(pino.multistream(streams, {}))
expectType<pino.MultiStreamRes>(pino.multistream(streams, { levels: { 'info': 30 } }))
expectType<pino.MultiStreamRes>(pino.multistream(streams, { dedupe: true }))
