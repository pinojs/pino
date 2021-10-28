import { expectType, expectAssignable } from 'tsd'
import type { SonicBoom } from "sonic-boom";

import {
    destination,
    LevelMapping,
    levels,
    SerializedError,
    stdSerializers,
    stdTimeFunctions,
    symbols,
    version,
} from "../../pino";
import pino from "../../pino";

expectType<SonicBoom>(destination(""));
expectType<LevelMapping>(levels);
expectType<SerializedError>(stdSerializers.err({} as any));
expectType<string>(stdTimeFunctions.isoTime());
expectType<string>(version);

// Can't test against `unique symbol`, see https://github.com/SamVerschueren/tsd/issues/49
expectAssignable<Symbol>(symbols.endSym);
