import { expectType } from "tsd";

import pino from "../../";
import type {Logger, LogFn, P} from "../../pino";

const log = pino();
expectType<Logger>(log);
expectType<LogFn>(log.info);

expectType<P.Logger>(log);
expectType<P.LogFn>(log.info);