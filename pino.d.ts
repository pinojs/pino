// Type definitions for pino 7.0
// Project: https://github.com/pinojs/pino.git, http://getpino.io
// Definitions by: Peter Snider <https://github.com/psnider>
//                 BendingBender <https://github.com/BendingBender>
//                 Christian Rackerseder <https://github.com/screendriver>
//                 GP <https://github.com/paambaati>
//                 Alex Ferrando <https://github.com/alferpal>
//                 Oleksandr Sidko <https://github.com/mortiy>
//                 Harris Lummis <https://github.com/lummish>
//                 Raoul Jaeckel <https://github.com/raoulus>
//                 Cory Donkin <https://github.com/Cooryd>
//                 Adam Vigneaux <https://github.com/AdamVig>
//                 Austin Beer <https://github.com/austin-beer>
//                 Michel Nemnom <https://github.com/Pegase745>
//                 Igor Savin <https://github.com/kibertoad>
//                 James Bromwell <https://github.com/thw0rted>
// TypeScript Version: 4.4

import * as pino from "./pino-exports";
import {
    // Constants and functions
    destination,
    transport,
    multistream,
    final,
    levels,
    stdSerializers,
    stdTimeFunctions,
    symbols,
    version,

    // Types
    Bindings,
    Level,
    LevelChangeEventListener,
    LogDescriptor,
    Logger,
    SerializedError,
    SerializedRequest,
    SerializedResponse,
    
    // Interfaces
    ChildLoggerOptions,
    DestinationStream,
    LevelMapping,
    LogEvent,
    LogFn,
    LoggerOptions,
    MultiStreamOptions,
    MultiStreamRes,
    StreamEntry,
    TransportBaseOptions,
    TransportMultiOptions,
    TransportPipelineOptions,
    TransportSingleOptions,
    TransportTargetOptions,
} from "./pino-exports";

// Bundle all top level exports into a namespace, then export namespace both
// as default (`import pino from "pino"`) and named variable
// (`import {pino} from "pino"`).
export default pino;
export {
    pino,

    // Pass through all the top-level exports, allows `import {version} from "pino"`
    destination,
    transport,
    multistream,
    final,
    levels,
    stdSerializers,
    stdTimeFunctions,
    symbols,
    version,
};

// Export just the type side of the namespace as "P", allows
// `import {P} from "pino"; const log: P.Logger;`.
// (Legacy support for early 7.x releases, remove in 8.x.)
export type {
    pino as P,

    // Types
    Bindings,
    Level,
    LevelChangeEventListener,
    LogDescriptor,
    Logger,
    SerializedError,
    SerializedRequest,
    SerializedResponse,

    // Interfaces
    ChildLoggerOptions,
    DestinationStream,
    LevelMapping,
    LogEvent,
    LogFn,
    LoggerOptions,
    MultiStreamOptions,
    MultiStreamRes,
    StreamEntry,
    TransportBaseOptions,
    TransportMultiOptions,
    TransportPipelineOptions,
    TransportSingleOptions,
    TransportTargetOptions,
}
