import { expectAssignable, expectType } from "tsd";

import pino from "../../";
import type {LevelWithSilent, Logger, LogFn, P} from "../../pino";

// NB: can also use `import * as pino`, but that form is callable as `pino()`
// under `esModuleInterop: false` or `pino.default()` under `esModuleInterop: true`.
const log = pino();
expectType<Logger>(log);
expectType<LogFn>(log.info);

expectType<P.Logger>(log);
expectType<P.LogFn>(log.info);

const level: LevelWithSilent = 'silent';
expectAssignable<P.LevelWithSilent>(level);
