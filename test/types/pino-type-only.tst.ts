import { expect } from 'tstyche'

import pino from '../../pino.js'
import type {
  LevelWithSilent,
  Logger,
  LogFn,
  DestinationStreamWithMetadata,
  Level,
  LevelOrString,
  LevelWithSilentOrString,
  LoggerExtras,
  LoggerOptions,
  TimeFn,
  MixinFn,
  MixinMergeStrategyFn,
  CustomLevelLogger,
  OnChildCallback,
  DestinationStreamHasMetadata,
  PlaceholderSpecifier,
  PlaceholderTypeMapping,
  ParseLogFnArgs
} from '../../pino.js'

// NB: can also use `import * as pino`, but that form is callable as `pino()`
// under `esModuleInterop: false` or `pino.default()` under `esModuleInterop: true`.
const log = pino()
expect(log).type.toBeAssignableTo<LoggerExtras>()
expect(log).type.toBe<Logger>()
expect(log.info).type.toBe<LogFn>()

expect<Parameters<typeof log.isLevelEnabled>>().type.toBe<[typeof log.level]>()

const level: Level = 'debug'
expect(level).type.toBeAssignableTo<string>()

const levelWithSilent: LevelWithSilent = 'silent'
expect(levelWithSilent).type.toBeAssignableTo<string>()

const levelOrString: LevelOrString = 'myCustomLevel'
expect(levelOrString).type.toBeAssignableTo<string>()
expect(levelOrString).type.not.toBeAssignableTo<pino.Level>()
expect(levelOrString).type.not.toBeAssignableTo<pino.LevelWithSilent>()
expect(levelOrString).type.toBeAssignableTo<pino.LevelWithSilentOrString>()

const levelWithSilentOrString: LevelWithSilentOrString = 'myCustomLevel'
expect(levelWithSilentOrString).type.toBeAssignableTo<string>()
expect(levelWithSilentOrString).type.not.toBeAssignableTo<pino.Level>()
expect(
  levelWithSilentOrString
).type.not.toBeAssignableTo<pino.LevelWithSilent>()
expect(levelWithSilentOrString).type.toBeAssignableTo<pino.LevelOrString>()

function createStream (): DestinationStreamWithMetadata {
  return { write () {} }
}

const stream = createStream()
// Argh. TypeScript doesn't seem to narrow unless we assign the symbol like so
const needsMetadata: typeof pino.symbols.needsMetadataGsym =
  pino.symbols.needsMetadataGsym
if (stream[needsMetadata]) {
  expect(stream.lastLevel).type.toBe<number>()
}

const loggerOptions: LoggerOptions = {
  browser: {
    formatters: {
      log (obj) {
        return obj
      },
      level (label, number) {
        return { label, number }
      }
    }
  }
}

expect(loggerOptions).type.toBe<LoggerOptions>()

// Reference: https://github.com/pinojs/pino/issues/2285
const someConst = 'test' as const
pino().error({}, someConst)
const someFunc = <T extends typeof someConst>(someConst: T) => {
  pino().error({}, someConst)
}

// Reference: https://github.com/pinojs/pino/issues/2531
expect<pino.TimeFn>().type.toBe<TimeFn>()
expect<pino.MixinFn>().type.toBe<MixinFn>()
expect<pino.MixinMergeStrategyFn>().type.toBe<MixinMergeStrategyFn>()
expect<pino.CustomLevelLogger<'foo'>>().type.toBe<CustomLevelLogger<'foo'>>()
expect<pino.OnChildCallback>().type.toBe<OnChildCallback>()
expect<pino.DestinationStreamHasMetadata>().type.toBe<DestinationStreamHasMetadata>()
expect<pino.PlaceholderSpecifier>().type.toBe<PlaceholderSpecifier>()
expect<pino.PlaceholderTypeMapping<'s'>>().type.toBe<PlaceholderTypeMapping<'s'>>()
expect<pino.ParseLogFnArgs<'%s'>>().type.toBe<ParseLogFnArgs<'%s'>>()
