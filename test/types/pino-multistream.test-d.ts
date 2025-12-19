import { expect } from 'tstyche'

import { createWriteStream } from 'node:fs'

import pino, { multistream } from '../../pino.js'

const streams = [
  { stream: process.stdout },
  { stream: createWriteStream('') },
  { level: 'error' as const, stream: process.stderr },
  { level: 'fatal' as const, stream: process.stderr },
]

expect(pino.multistream(process.stdout)).type.toBe<pino.MultiStreamRes>()
expect(pino.multistream([createWriteStream('')])).type.toBe<pino.MultiStreamRes>()
expect(pino.multistream({ level: 'error' as const, stream: process.stderr })).type.toBe<pino.MultiStreamRes<'error'>>()
expect(pino.multistream([{ level: 'fatal' as const, stream: createWriteStream('') }])).type.toBe<pino.MultiStreamRes<'fatal'>>()

expect(pino.multistream(streams)).type.toBe<pino.MultiStreamRes<'error' | 'fatal'>>()
expect(pino.multistream(streams, {})).type.toBe<pino.MultiStreamRes<'error' | 'fatal'>>()
expect(pino.multistream(streams, { levels: { info: 30 } })).type.toBe<pino.MultiStreamRes<'error' | 'fatal'>>()
expect(pino.multistream(streams, { dedupe: true })).type.toBe<pino.MultiStreamRes<'error' | 'fatal'>>()
expect(pino.multistream(streams[0]).add(streams[1])).type.toBe<pino.MultiStreamRes<'error' | 'fatal'>>()
expect(multistream(streams)).type.toBe<pino.MultiStreamRes<'error' | 'fatal'>>()
expect(multistream(streams).clone('error')).type.toBe<pino.MultiStreamRes<'error'>>()

expect(multistream(process.stdout)).type.toBe<pino.MultiStreamRes>()
