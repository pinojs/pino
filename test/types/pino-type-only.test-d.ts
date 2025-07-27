import { expectAssignable, expectType, expectNotAssignable } from "tsd";

import pino from "../../";
type LevelWithSilent = pino.LevelWithSilent;
type Logger = pino.Logger;
type LogFn = pino.LogFn;
type DestinationStreamWithMetadata = pino.DestinationStreamWithMetadata;
type Level = pino.Level;
type LevelOrString = pino.LevelOrString;
type LevelWithSilentOrString = pino.LevelWithSilentOrString;
type LoggerOptions = pino.LoggerOptions;

// NB: can also use `import * as pino`, but that form is callable as `pino()`
// under `esModuleInterop: false` or `pino.default()` under `esModuleInterop: true`.
const log = pino();
expectType<Logger>(log);
expectType<LogFn>(log.info);

expectType<Parameters<typeof log.isLevelEnabled>>([log.level]);

const level: Level = 'debug';
expectAssignable<string>(level);
expectAssignable<Level>(level);

const levelWithSilent: LevelWithSilent = 'silent';
expectAssignable<string>(levelWithSilent);
expectAssignable<LevelWithSilent>(levelWithSilent);

const levelOrString: LevelOrString = "myCustomLevel";
expectAssignable<string>(levelOrString);
expectNotAssignable<pino.Level>(levelOrString);
expectNotAssignable<pino.LevelWithSilent>(levelOrString);
expectAssignable<pino.LevelWithSilentOrString>(levelOrString);

const levelWithSilentOrString: LevelWithSilentOrString = "myCustomLevel";
expectAssignable<string>(levelWithSilentOrString);
expectNotAssignable<pino.Level>(levelWithSilentOrString);
expectNotAssignable<pino.LevelWithSilent>(levelWithSilentOrString);
expectAssignable<pino.LevelOrString>(levelWithSilentOrString);

function createStream(): DestinationStreamWithMetadata {
    return { write() {} };
}

const stream = createStream();
// Argh. TypeScript doesn't seem to narrow unless we assign the symbol like so, and tsd seems to
// break without annotating the type explicitly
const needsMetadata: typeof pino.symbols.needsMetadataGsym = pino.symbols.needsMetadataGsym;
if (stream[needsMetadata]) {
    expectType<number>(stream.lastLevel);
}

const loggerOptions:LoggerOptions = {
    browser: {
        formatters: {
            log(obj) {
                return obj
            },
            level(label, number) {
                return { label, number}
            }

        }
    }
}

expectType<LoggerOptions>(loggerOptions)
