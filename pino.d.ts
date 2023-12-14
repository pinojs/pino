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

import type { EventEmitter } from "events";
import * as pinoStdSerializers from "pino-std-serializers";
import type { SonicBoom, SonicBoomOpts } from "sonic-boom";
import type { WorkerOptions } from "worker_threads";



//// Non-exported types and interfaces

// ToDo https://github.com/pinojs/thread-stream/issues/24
type ThreadStream = any

type TimeFn = () => string;
type MixinFn = (mergeObject: object, level: number) => object;
type MixinMergeStrategyFn = (mergeObject: object, mixinObject: object) => object;

type CustomLevelLogger<CustomLevels extends string> = { [level in CustomLevels]: LogFn }

/**
* A synchronous callback that will run on each creation of a new child.
* @param child: The newly created child logger instance.
*/
type OnChildCallback<CustomLevels extends string = never> = (child: pino.Logger<CustomLevels>) => void

export interface redactOptions {
    paths: string[];
    censor?: string | ((value: any, path: string[]) => any);
    remove?: boolean;
}

export interface LoggerExtras<CustomLevels extends string = never> extends EventEmitter {
    /**
     * Exposes the Pino package version. Also available on the exported pino function.
     */
    readonly version: string;

    levels: pino.LevelMapping;

    /**
     * Outputs the level as a string instead of integer.
     */
    useLevelLabels: boolean;
    /**
     * Define additional logging levels.
     */
    customLevels: { [level in CustomLevels]: number };
    /**
     * Use only defined `customLevels` and omit Pino's levels.
     */
    useOnlyCustomLevels: boolean;
    /**
     * Returns the integer value for the logger instance's logging level.
     */
    levelVal: number;

    /**
     * Creates a child logger, setting all key-value pairs in `bindings` as properties in the log lines. All serializers will be applied to the given pair.
     * Child loggers use the same output stream as the parent and inherit the current log level of the parent at the time they are spawned.
     * From v2.x.x the log level of a child is mutable (whereas in v1.x.x it was immutable), and can be set independently of the parent.
     * If a `level` property is present in the object passed to `child` it will override the child logger level.
     *
     * @param bindings: an object of key-value pairs to include in log lines as properties.
     * @param options: an options object that will override child logger inherited options.
     * @returns a child logger instance.
     */
    child<ChildCustomLevels extends string = never>(bindings: pino.Bindings, options?: ChildLoggerOptions<ChildCustomLevels>): pino.Logger<CustomLevels | ChildCustomLevels>;

    /**
     * This can be used to modify the callback function on creation of a new child.
     */
    onChild: OnChildCallback<CustomLevels>;

    /**
     * Registers a listener function that is triggered when the level is changed.
     * Note: When browserified, this functionality will only be available if the `events` module has been required elsewhere
     * (e.g. if you're using streams in the browser). This allows for a trade-off between bundle size and functionality.
     *
     * @param event: only ever fires the `'level-change'` event
     * @param listener: The listener is passed four arguments: `levelLabel`, `levelValue`, `previousLevelLabel`, `previousLevelValue`.
     */
    on(event: "level-change", listener: pino.LevelChangeEventListener<CustomLevels>): this;
    addListener(event: "level-change", listener: pino.LevelChangeEventListener<CustomLevels>): this;
    once(event: "level-change", listener: pino.LevelChangeEventListener<CustomLevels>): this;
    prependListener(event: "level-change", listener: pino.LevelChangeEventListener<CustomLevels>): this;
    prependOnceListener(event: "level-change", listener: pino.LevelChangeEventListener<CustomLevels>): this;
    removeListener(event: "level-change", listener: pino.LevelChangeEventListener<CustomLevels>): this;

    /**
     * A utility method for determining if a given log level will write to the destination.
     */
    isLevelEnabled(level: pino.LevelWithSilentOrString): boolean;

    /**
     * Returns an object containing all the current bindings, cloned from the ones passed in via logger.child().
     */
    bindings(): pino.Bindings;

    /**
     * Adds to the bindings of this logger instance.
     * Note: Does not overwrite bindings. Can potentially result in duplicate keys in log lines.
     *
     * @param bindings: an object of key-value pairs to include in log lines as properties.
     */
    setBindings(bindings: pino.Bindings): void;

    /**
     * Flushes the content of the buffer when using pino.destination({ sync: false }).
     * call the callback when finished
     */
    flush(cb?: (err?: Error) => void): void;
}


declare namespace pino {
    //// Exported types and interfaces

    interface BaseLogger {
        /**
         * Set this property to the desired logging level. In order of priority, available levels are:
         *
         * - 'fatal'
         * - 'error'
         * - 'warn'
         * - 'info'
         * - 'debug'
         * - 'trace'
         *
         * The logging level is a __minimum__ level. For instance if `logger.level` is `'info'` then all `'fatal'`, `'error'`, `'warn'`,
         * and `'info'` logs will be enabled.
         *
         * You can pass `'silent'` to disable logging.
         */
        level: pino.LevelWithSilentOrString;

        /**
         * Log at `'fatal'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
        fatal: pino.LogFn;
        /**
         * Log at `'error'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
        error: pino.LogFn;
        /**
         * Log at `'warn'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
        warn: pino.LogFn;
        /**
         * Log at `'info'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
        info: pino.LogFn;
        /**
         * Log at `'debug'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
        debug: pino.LogFn;
        /**
         * Log at `'trace'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
        trace: pino.LogFn;
        /**
         * Noop function.
         */
        silent: pino.LogFn;
    }

    type Bindings = Record<string, any>;

    type Level = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    type LevelOrString = Level | (string & {});
    type LevelWithSilent = pino.Level | "silent";
    type LevelWithSilentOrString = LevelWithSilent | (string & {});

    type SerializerFn = (value: any) => any;
    type WriteFn = (o: object) => void;

    type LevelChangeEventListener<CustomLevels extends string = never> = (
        lvl: LevelWithSilentOrString,
        val: number,
        prevLvl: LevelWithSilentOrString,
        prevVal: number,
        logger: Logger<CustomLevels>
    ) => void;

    type LogDescriptor = Record<string, any>;

    type Logger<CustomLevels extends string = never> = BaseLogger & LoggerExtras<CustomLevels> & CustomLevelLogger<CustomLevels>;

    type SerializedError = pinoStdSerializers.SerializedError;
    type SerializedResponse = pinoStdSerializers.SerializedResponse;
    type SerializedRequest = pinoStdSerializers.SerializedRequest;


    interface TransportTargetOptions<TransportOptions = Record<string, any>> {
        target: string
        options?: TransportOptions
        level?: LevelWithSilentOrString
    }

    interface TransportBaseOptions<TransportOptions = Record<string, any>> {
        options?: TransportOptions
        worker?: WorkerOptions & { autoEnd?: boolean}
    }

    interface TransportSingleOptions<TransportOptions = Record<string, any>> extends TransportBaseOptions<TransportOptions>{
        target: string
    }

    interface TransportPipelineOptions<TransportOptions = Record<string, any>> extends TransportBaseOptions<TransportOptions>{
        pipeline: TransportSingleOptions<TransportOptions>[]
    }

    interface TransportMultiOptions<TransportOptions = Record<string, any>> extends TransportBaseOptions<TransportOptions>{
        targets: readonly TransportTargetOptions<TransportOptions>[],
        levels?: Record<string, number>
        dedupe?: boolean
    }

    interface MultiStreamOptions {
        levels?: Record<string, number>
        dedupe?: boolean
    }

    interface DestinationStream {
        write(msg: string): void;
    }

    interface DestinationStreamHasMetadata {
      [symbols.needsMetadataGsym]: true;
      lastLevel: number;
      lastTime: string;
      lastMsg: string;
      lastObj: object;
      lastLogger: pino.Logger;
    }

    type DestinationStreamWithMetadata = DestinationStream & ({ [symbols.needsMetadataGsym]?: false } | DestinationStreamHasMetadata);

    interface StreamEntry<TLevel = Level> {
        stream: DestinationStream
        level?: TLevel
    }

    interface MultiStreamRes<TOriginLevel = Level> {
        write: (data: any) => void,
        add: <TLevel = Level>(dest: StreamEntry<TLevel> | DestinationStream) => MultiStreamRes<TOriginLevel & TLevel>,
        flushSync: () => void,
        minLevel: number,
        streams: StreamEntry<TOriginLevel>[],
        clone<TLevel = Level>(level: TLevel): MultiStreamRes<TLevel>,
    }

    interface LevelMapping {
        /**
         * Returns the mappings of level names to their respective internal number representation.
         */
        values: { [level: string]: number };
        /**
         * Returns the mappings of level internal level numbers to their string representations.
         */
        labels: { [level: number]: string };
    }

    interface LogFn {
        // TODO: why is this different from `obj: object` or `obj: any`?
        /* tslint:disable:no-unnecessary-generics */
        <T extends object>(obj: T, msg?: string, ...args: any[]): void;
        (obj: unknown, msg?: string, ...args: any[]): void;
        (msg: string, ...args: any[]): void;
    }

    interface LoggerOptions<CustomLevels extends string = never> {
        transport?: TransportSingleOptions | TransportMultiOptions | TransportPipelineOptions
        /**
         * Avoid error causes by circular references in the object tree. Default: `true`.
         */
        safe?: boolean;
        /**
         * The name of the logger. Default: `undefined`.
         */
        name?: string;
        /**
         * an object containing functions for custom serialization of objects.
         * These functions should return an JSONifiable object and they should never throw. When logging an object,
         * each top-level property matching the exact key of a serializer will be serialized using the defined serializer.
         */
        serializers?: { [key: string]: SerializerFn };
        /**
         * Enables or disables the inclusion of a timestamp in the log message. If a function is supplied, it must
         * synchronously return a JSON string representation of the time. If set to `false`, no timestamp will be included in the output.
         * See stdTimeFunctions for a set of available functions for passing in as a value for this option.
         * Caution: any sort of formatted time will significantly slow down Pino's performance.
         */
        timestamp?: TimeFn | boolean;
        /**
         * One of the supported levels or `silent` to disable logging. Any other value defines a custom level and
         * requires supplying a level value via `levelVal`. Default: 'info'.
         */
        level?: LevelWithSilentOrString;

        /**
         * Use this option to define additional logging levels.
         * The keys of the object correspond the namespace of the log level, and the values should be the numerical value of the level.
         */
        customLevels?: { [level in CustomLevels]: number };
        /**
         * Use this option to only use defined `customLevels` and omit Pino's levels.
         * Logger's default `level` must be changed to a value in `customLevels` in order to use `useOnlyCustomLevels`
         * Warning: this option may not be supported by downstream transports.
         */
        useOnlyCustomLevels?: boolean;

        /**
         * If provided, the `mixin` function is called each time one of the active logging methods
         * is called. The function must synchronously return an object. The properties of the
         * returned object will be added to the logged JSON.
         */
        mixin?: MixinFn;

        /**
         * If provided, the `mixinMergeStrategy` function is called each time one of the active
         * logging methods is called. The first parameter is the value `mergeObject` or an empty object,
         * the second parameter is the value resulting from `mixin()` or an empty object.
         * The function must synchronously return an object.
         */
        mixinMergeStrategy?: MixinMergeStrategyFn

        /**
         * As an array, the redact option specifies paths that should have their values redacted from any log output.
         *
         * Each path must be a string using a syntax which corresponds to JavaScript dot and bracket notation.
         *
         * If an object is supplied, three options can be specified:
         *
         *      paths (String[]): Required. An array of paths
         *      censor (String): Optional. A value to overwrite key which are to be redacted. Default: '[Redacted]'
         *      remove (Boolean): Optional. Instead of censoring the value, remove both the key and the value. Default: false
         */
        redact?: string[] | redactOptions;

        /**
         * When defining a custom log level via level, set to an integer value to define the new level. Default: `undefined`.
         */
        levelVal?: number;
        /**
         * The string key for the 'message' in the JSON object. Default: "msg".
         */
        messageKey?: string;
        /**
         * The string key for the 'error' in the JSON object. Default: "err".
         */
        errorKey?: string;
        /**
         * The string key to place any logged object under.
         */
        nestedKey?: string;
        /**
         * Enables logging. Default: `true`.
         */
        enabled?: boolean;
        /**
         * Browser only, see http://getpino.io/#/docs/browser.
         */
        browser?: {
            /**
             * The `asObject` option will create a pino-like log object instead of passing all arguments to a console
             * method. When `write` is set, `asObject` will always be true.
             *
             * @example
             * pino.info('hi') // creates and logs {msg: 'hi', level: 30, time: <ts>}
             */
            asObject?: boolean;
            /**
             * Instead of passing log messages to `console.log` they can be passed to a supplied function. If `write` is
             * set to a single function, all logging objects are passed to this function. If `write` is an object, it
             * can have methods that correspond to the levels. When a message is logged at a given level, the
             * corresponding method is called. If a method isn't present, the logging falls back to using the `console`.
             *
             * @example
             * const pino = require('pino')({
             *   browser: {
             *     write: (o) => {
             *       // do something with o
             *     }
             *   }
             * })
             *
             * @example
             * const pino = require('pino')({
             *   browser: {
             *     write: {
             *       info: function (o) {
             *         //process info log object
             *       },
             *       error: function (o) {
             *         //process error log object
             *       }
             *     }
             *   }
             * })
             */
            write?:
                | WriteFn
                | ({
                fatal?: WriteFn;
                error?: WriteFn;
                warn?: WriteFn;
                info?: WriteFn;
                debug?: WriteFn;
                trace?: WriteFn;
            } & { [logLevel: string]: WriteFn });

            /**
             * The serializers provided to `pino` are ignored by default in the browser, including the standard
             * serializers provided with Pino. Since the default destination for log messages is the console, values
             * such as `Error` objects are enhanced for inspection, which they otherwise wouldn't be if the Error
             * serializer was enabled. We can turn all serializers on or we can selectively enable them via an array.
             *
             * When `serialize` is `true` the standard error serializer is also enabled (see
             * {@link https://github.com/pinojs/pino/blob/master/docs/api.md#pino-stdserializers}). This is a global
             * serializer which will apply to any `Error` objects passed to the logger methods.
             *
             * If `serialize` is an array the standard error serializer is also automatically enabled, it can be
             * explicitly disabled by including a string in the serialize array: `!stdSerializers.err` (see example).
             *
             * The `serialize` array also applies to any child logger serializers (see
             * {@link https://github.com/pinojs/pino/blob/master/docs/api.md#bindingsserializers-object} for how to
             * set child-bound serializers).
             *
             * Unlike server pino the serializers apply to every object passed to the logger method, if the `asObject`
             * option is `true`, this results in the serializers applying to the first object (as in server pino).
             *
             * For more info on serializers see
             * {@link https://github.com/pinojs/pino/blob/master/docs/api.md#serializers-object}.
             *
             * @example
             * const pino = require('pino')({
             *   browser: {
             *     serialize: true
             *   }
             * })
             *
             * @example
             * const pino = require('pino')({
             *   serializers: {
             *     custom: myCustomSerializer,
             *     another: anotherSerializer
             *   },
             *   browser: {
             *     serialize: ['custom']
             *   }
             * })
             * // following will apply myCustomSerializer to the custom property,
             * // but will not apply anotherSerializer to another key
             * pino.info({custom: 'a', another: 'b'})
             *
             * @example
             * const pino = require('pino')({
             *   serializers: {
             *     custom: myCustomSerializer,
             *     another: anotherSerializer
             *   },
             *   browser: {
             *     serialize: ['!stdSerializers.err', 'custom'] //will not serialize Errors, will serialize `custom` keys
             *   }
             * })
             */
            serialize?: boolean | string[];

            /**
             * Options for transmission of logs.
             *
             * @example
             * const pino = require('pino')({
             *   browser: {
             *     transmit: {
             *       level: 'warn',
             *       send: function (level, logEvent) {
             *         if (level === 'warn') {
             *           // maybe send the logEvent to a separate endpoint
             *           // or maybe analyse the messages further before sending
             *         }
             *         // we could also use the `logEvent.level.value` property to determine
             *         // numerical value
             *         if (logEvent.level.value >= 50) { // covers error and fatal
             *
             *           // send the logEvent somewhere
             *         }
             *       }
             *     }
             *   }
             * })
             */
            transmit?: {
                /**
                 * Specifies the minimum level (inclusive) of when the `send` function should be called, if not supplied
                 * the `send` function will be called based on the main logging `level` (set via `options.level`,
                 * defaulting to `info`).
                 */
                level?: LevelOrString;
                /**
                 * Remotely record log messages.
                 *
                 * @description Called after writing the log message.
                 */
                send: (level: Level, logEvent: LogEvent) => void;
            };
            /**
             * The disabled option will disable logging in browser if set to true, by default it is set to false.
             *
             * @example
             * const pino = require('pino')({browser: {disabled: true}})
             */
            disabled?: boolean;
        };
        /**
         * key-value object added as child logger to each log line. If set to null the base child logger is not added
         */
        base?: { [key: string]: any } | null;

        /**
         * An object containing functions for formatting the shape of the log lines.
         * These functions should return a JSONifiable object and should never throw.
         * These functions allow for full customization of the resulting log lines.
         * For example, they can be used to change the level key name or to enrich the default metadata.
         */
        formatters?: {
            /**
             * Changes the shape of the log level.
             * The default shape is { level: number }.
             * The function takes two arguments, the label of the level (e.g. 'info') and the numeric value (e.g. 30).
             */
            level?: (label: string, number: number) => object;
            /**
             * Changes the shape of the bindings.
             * The default shape is { pid, hostname }.
             * The function takes a single argument, the bindings object.
             * It will be called every time a child logger is created.
             */
            bindings?: (bindings: Bindings) => object;
            /**
             * Changes the shape of the log object.
             * This function will be called every time one of the log methods (such as .info) is called.
             * All arguments passed to the log method, except the message, will be pass to this function.
             * By default it does not change the shape of the log object.
             */
            log?: (object: Record<string, unknown>) => Record<string, unknown>;
        };

        /**
         * A string that would be prefixed to every message (and child message)
         */
        msgPrefix?: string

        /**
         * An object mapping to hook functions. Hook functions allow for customizing internal logger operations.
         * Hook functions must be synchronous functions.
         */
        hooks?: {
            /**
             * Allows for manipulating the parameters passed to logger methods. The signature for this hook is
             * logMethod (args, method, level) {}, where args is an array of the arguments that were passed to the
             * log method and method is the log method itself, and level is the log level. This hook must invoke the method function by
             * using apply, like so: method.apply(this, newArgumentsArray).
             */
            logMethod?: (this: Logger, args: Parameters<LogFn>, method: LogFn, level: number) => void;
        };

        /**
         * Stringification limit at a specific nesting depth when logging circular object. Default: `5`.
         */
         depthLimit?: number

         /**
          * Stringification limit of properties/elements when logging a specific object/array with circular references. Default: `100`.
          */
          edgeLimit?: number

        /**
         * Optional child creation callback.
         */
        onChild?: OnChildCallback;

        /**
         * logs newline delimited JSON with `\r\n` instead of `\n`. Default: `false`.
         */
        crlf?: boolean;
    }

    interface ChildLoggerOptions<CustomLevels extends string = never> {
        level?: LevelOrString;
        serializers?: { [key: string]: SerializerFn };
        customLevels?: { [level in CustomLevels]: number };
        formatters?: {
            level?: (label: string, number: number) => object;
            bindings?: (bindings: Bindings) => object;
            log?: (object: object) => object;
        };
        redact?: string[] | redactOptions;
        msgPrefix?: string
    }

    /**
     * A data structure representing a log message, it represents the arguments passed to a logger statement, the level
     * at which they were logged and the hierarchy of child bindings.
     *
     * @description By default serializers are not applied to log output in the browser, but they will always be applied
     * to `messages` and `bindings` in the `logEvent` object. This allows  us to ensure a consistent format for all
     * values between server and client.
     */
    interface LogEvent {
        /**
         * Unix epoch timestamp in milliseconds, the time is taken from the moment the logger method is called.
         */
        ts: number;
        /**
         * All arguments passed to logger method, (for instance `logger.info('a', 'b', 'c')` would result in `messages`
         * array `['a', 'b', 'c']`).
         */
        messages: any[];
        /**
         * Represents each child logger (if any), and the relevant bindings.
         *
         * @description For instance, given `logger.child({a: 1}).child({b: 2}).info({c: 3})`, the bindings array would
         * hold `[{a: 1}, {b: 2}]` and the `messages` array would be `[{c: 3}]`. The `bindings` are ordered according to
         * their position in the child logger hierarchy, with the lowest index being the top of the hierarchy.
         */
        bindings: Bindings[];
        /**
         * Holds the `label` (for instance `info`), and the corresponding numerical `value` (for instance `30`).
         * This could be important in cases where client side level values and labels differ from server side.
         */
        level: {
            label: string;
            value: number;
        };
    }



    //// Top level variable (const) exports

    /**
     * Provides functions for serializing objects common to many projects.
     */
    export const stdSerializers: typeof pinoStdSerializers;

    /**
     * Holds the current log format version (as output in the v property of each log record).
     */
    export const levels: LevelMapping;
    export const symbols: {
        readonly setLevelSym: unique symbol;
        readonly getLevelSym: unique symbol;
        readonly levelValSym: unique symbol;
        readonly useLevelLabelsSym: unique symbol;
        readonly mixinSym: unique symbol;
        readonly lsCacheSym: unique symbol;
        readonly chindingsSym: unique symbol;
        readonly parsedChindingsSym: unique symbol;
        readonly asJsonSym: unique symbol;
        readonly writeSym: unique symbol;
        readonly serializersSym: unique symbol;
        readonly redactFmtSym: unique symbol;
        readonly timeSym: unique symbol;
        readonly timeSliceIndexSym: unique symbol;
        readonly streamSym: unique symbol;
        readonly stringifySym: unique symbol;
        readonly stringifySafeSym: unique symbol;
        readonly stringifiersSym: unique symbol;
        readonly endSym: unique symbol;
        readonly formatOptsSym: unique symbol;
        readonly messageKeySym: unique symbol;
        readonly errorKeySym: unique symbol;
        readonly nestedKeySym: unique symbol;
        readonly wildcardFirstSym: unique symbol;
        readonly needsMetadataGsym: unique symbol;
        readonly useOnlyCustomLevelsSym: unique symbol;
        readonly formattersSym: unique symbol;
        readonly hooksSym: unique symbol;
    };

    /**
     * Exposes the Pino package version. Also available on the logger instance.
     */
    export const version: string;

    /**
     * Provides functions for generating the timestamp property in the log output. You can set the `timestamp` option during
     * initialization to one of these functions to adjust the output format. Alternatively, you can specify your own time function.
     * A time function must synchronously return a string that would be a valid component of a JSON string. For example,
     * the default function returns a string like `,"time":1493426328206`.
     */
    export const stdTimeFunctions: {
        /**
         * The default time function for Pino. Returns a string like `,"time":1493426328206`.
         */
        epochTime: TimeFn;
        /*
            * Returns the seconds since Unix epoch
            */
        unixTime: TimeFn;
        /**
         * Returns an empty string. This function is used when the `timestamp` option is set to `false`.
         */
        nullTime: TimeFn;
        /*
            * Returns ISO 8601-formatted time in UTC
            */
        isoTime: TimeFn;
    };

    //// Exported functions

    /**
     * Create a Pino Destination instance: a stream-like object with significantly more throughput (over 30%) than a standard Node.js stream.
     * @param [dest]: The `destination` parameter, at a minimum must be an object with a `write` method. An ordinary Node.js
     *                `stream` can be passed as the destination (such as the result of `fs.createWriteStream`) but for peak log
     *                writing performance it is strongly recommended to use `pino.destination` to create the destination stream.
     * @returns A Sonic-Boom  stream to be used as destination for the pino function
     */
    export function destination(
        dest?: string | number | SonicBoomOpts | DestinationStream | NodeJS.WritableStream,
    ): SonicBoom;

    export function transport<TransportOptions = Record<string, any>>(
        options: TransportSingleOptions<TransportOptions> | TransportMultiOptions<TransportOptions> | TransportPipelineOptions<TransportOptions>
    ): ThreadStream

    export function multistream<TLevel = Level>(
        streamsArray: (DestinationStream | StreamEntry<TLevel>)[] | DestinationStream | StreamEntry<TLevel>,
        opts?: MultiStreamOptions
    ): MultiStreamRes<TLevel>
}

//// Callable default export

/**
 * @param [optionsOrStream]: an options object or a writable stream where the logs will be written. It can also receive some log-line metadata, if the
 * relative protocol is enabled. Default: process.stdout
 * @returns a new logger instance.
 */
declare function pino<CustomLevels extends string = never>(optionsOrStream?: LoggerOptions<CustomLevels> | DestinationStream): Logger<CustomLevels>;

/**
 * @param [options]: an options object
 * @param [stream]: a writable stream where the logs will be written. It can also receive some log-line metadata, if the
 * relative protocol is enabled. Default: process.stdout
 * @returns a new logger instance.
 */
declare function pino<CustomLevels extends string>(options: LoggerOptions<CustomLevels>, stream: DestinationStream): Logger<CustomLevels>;


// Pass through all the top-level exports, allows `import {version} from "pino"`
// Constants and functions
export const destination: typeof pino.destination;
export const transport: typeof pino.transport;
export const multistream: typeof pino.multistream;
export const levels: typeof pino.levels;
export const stdSerializers: typeof pino.stdSerializers;
export const stdTimeFunctions: typeof pino.stdTimeFunctions;
export const symbols: typeof pino.symbols;
export const version: typeof pino.version;

// Types
export type Bindings = pino.Bindings;
export type DestinationStreamWithMetadata = pino.DestinationStreamWithMetadata;
export type Level = pino.Level;
export type LevelOrString = pino.LevelOrString;
export type LevelWithSilent = pino.LevelWithSilent;
export type LevelWithSilentOrString = pino.LevelWithSilentOrString;
export type LevelChangeEventListener<CustomLevels extends string> = pino.LevelChangeEventListener<CustomLevels>;
export type LogDescriptor = pino.LogDescriptor;
export type Logger<CustomLevels extends string = never> = pino.Logger<CustomLevels>;
export type SerializedError = pino.SerializedError;
export type SerializerFn = pino.SerializerFn;
export type SerializedRequest = pino.SerializedRequest;
export type SerializedResponse = pino.SerializedResponse;
export type WriteFn = pino.WriteFn;

// Interfaces
export interface BaseLogger extends pino.BaseLogger {}
export interface ChildLoggerOptions<CustomLevels extends string = never> extends pino.ChildLoggerOptions<CustomLevels> {}
export interface DestinationStream extends pino.DestinationStream {}
export interface LevelMapping extends pino.LevelMapping {}
export interface LogEvent extends pino.LogEvent {}
export interface LogFn extends pino.LogFn {}
export interface LoggerOptions<CustomLevels extends string = never> extends pino.LoggerOptions<CustomLevels> {}
export interface MultiStreamOptions extends pino.MultiStreamOptions {}
export interface MultiStreamRes<TLevel = Level> extends pino.MultiStreamRes<TLevel> {}
export interface StreamEntry<TLevel = Level> extends pino.StreamEntry<TLevel> {}
export interface TransportBaseOptions extends pino.TransportBaseOptions {}
export interface TransportMultiOptions extends pino.TransportMultiOptions {}
export interface TransportPipelineOptions extends pino.TransportPipelineOptions {}
export interface TransportSingleOptions extends pino.TransportSingleOptions {}
export interface TransportTargetOptions extends pino.TransportTargetOptions {}

// Bundle all top level exports into a namespace, then export namespace both
// as default (`import pino from "pino"`) and named variable
// (`import {pino} from "pino"`).
export { pino as default, pino };
// Export just the type side of the namespace as "P", allows
// `import {P} from "pino"; const log: P.Logger;`.
// (Legacy support for early 7.x releases, remove in 8.x.)
export type { pino as P };
