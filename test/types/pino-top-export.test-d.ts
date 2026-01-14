import { expect } from 'tstyche'

import type { SonicBoom } from 'sonic-boom'
import type ThreadStream from 'thread-stream'

import {
  destination,
  type LevelMapping,
  levels,
  multistream,
  type MultiStreamRes,
  type SerializedError,
  stdSerializers,
  stdTimeFunctions,
  transport,
  version
} from '../../pino.js'

expect(destination('')).type.toBe<SonicBoom>()
expect(levels).type.toBe<LevelMapping>()
expect(multistream(process.stdout)).type.toBe<MultiStreamRes>()
expect(stdSerializers.err({} as Error)).type.toBe<SerializedError>()
expect(stdTimeFunctions.isoTime()).type.toBe<string>()
expect(stdTimeFunctions.isoTimeNano()).type.toBe<string>()
expect(version).type.toBe<string>()

expect(
  transport({
    target: '#pino/pretty',
    options: { some: 'options for', the: 'transport' }
  })
).type.toBe<ThreadStream>()
