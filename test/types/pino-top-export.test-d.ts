import { expectType, expectAssignable } from 'tsd'
import type { SonicBoom } from "sonic-boom";

import {
    destination,
    final,
    LevelMapping,
    levels,
    Logger,
    multistream,
    MultiStreamRes,
    SerializedError,
    stdSerializers,
    stdTimeFunctions,
    symbols,
    transport,
    version,
} from "../../pino";
import pino from "../../pino";

expectType<SonicBoom>(destination(""));
expectType<LevelMapping>(levels);
expectType<Logger>(final(pino()));
expectType<MultiStreamRes>(multistream(process.stdout));
expectType<SerializedError>(stdSerializers.err({} as any));
expectType<string>(stdTimeFunctions.isoTime());
expectType<string>(version);

// Can't test against `unique symbol`, see https://github.com/SamVerschueren/tsd/issues/49
expectAssignable<Symbol>(symbols.endSym);

// TODO: currently returns (aliased) `any`, waiting for strong typed `thread-stream`
transport({
    target: '#pino/pretty',
    options: { some: 'options for', the: 'transport' }
});

