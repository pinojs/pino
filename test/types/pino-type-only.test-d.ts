import { expectType } from "tsd";

import pino from "../../";
import type {Logger, LogFn, P} from "../../pino";

// NB: can also use `import * as pino`, but that form is callable as `pino()`
// under `esModuleInterop: false` or `pino.default()` under `esModuleInterop: true`.
const log = pino();
expectType<Logger & Record<never, pino.LogFn>>(log);
expectType<LogFn>(log.info);

expectType<P.Logger & Record<never, pino.LogFn>>(log);
expectType<P.LogFn>(log.info);