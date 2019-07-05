# API

* [pino() => logger](#export)
  * [options](#options)
  * [destination](#destination)
  * [destination\[Symbol.for('pino.metadata')\]](#metadata)
* [Logger Instance](#logger)
  * [logger.trace()](#trace)
  * [logger.debug()](#debug)
  * [logger.info()](#info)
  * [logger.warn()](#warn)
  * [logger.error()](#error)
  * [logger.fatal()](#fatal)
  * [logger.child()](#child)
  * [logger.bindings()](#bindings)
  * [logger.flush()](#flush)
  * [logger.level](#level)
  * [logger.isLevelEnabled()](#islevelenabled)
  * [logger.levels](#levels)
  * [logger\[Symbol.for('pino.serializers')\]](#serializers)
  * [Event: 'level-change'](#level-change)
  * [logger.version](#version)
  * [logger.LOG_VERSION](#log_version)
* [Statics](#statics)
  * [pino.destination()](#pino-destination)
  * [pino.extreme()](#pino-extreme)
  * [pino.final()](#pino-final)
  * [pino.stdSerializers](#pino-stdserializers)
  * [pino.stdTimeFunctions](#pino-stdtimefunctions)
  * [pino.symbols](#pino-symbols)
  * [pino.version](#pino-version)
  * [pino.LOG_VERSION](#pino-LOG_VERSION)

<a id="export"></a>
## `pino([options], [destination]) => logger`

The exported `pino` function takes two optional arguments,
[`options`](#options) and [`destination`](#destination) and
returns a [logger instance](#logger).

<a id=options></a>
### `options` (Object)

#### `name` (String)

Default: `undefined`

The name of the logger. When set adds a `name` field to every JSON line logged.

#### `level` (String)

Default: `'info'`

One of `'fatal'`, `'error'`, `'warn'`, `'info`', `'debug'`, `'trace'` or `'silent'`.

Additional levels can be added to the instance via the `customLevels` option.

* See [`customLevels` option](#opt-customlevels)

<a id=opt-customlevels></a>
#### `customLevels` (Object)

Default: `undefined`

Use this option to define additional logging levels.
The keys of the object correspond the namespace of the log level,
and the values should be the numerical value of the level.

```js
const logger = pino({
  customLevels: {
    foo: 35
  }
})
logger.foo('hi')
```

<a id=opt-useOnlyCustomLevels></a>
#### `useOnlyCustomLevels` (Boolean)

Default: `false`

Use this option to only use defined `customLevels` and omit Pino's levels.
Logger's default `level` must be changed to a value in `customLevels` in order to use `useOnlyCustomLevels`
Warning: this option may not be supported by downstream transports.

```js
const logger = pino({
  customLevels: {
    foo: 35
  },
  useOnlyCustomLevels: true,
  level: 'foo'
})
logger.foo('hi')
logger.info('hello') // Will throw an error saying info in not found in logger object
```

#### `redact` (Array | Object):

Default: `undefined`

As an array, the `redact` option specifies paths that should
have their values redacted from any log output.

Each path must be a string using a syntax which corresponds to JavaScript dot and bracket notation.

If an object is supplied, three options can be specified:
  * `paths` (array): Required. An array of paths. See [redaction - Path Syntax ⇗](/docs/redaction.md#paths) for specifics.
  * `censor` (String|Function|Undefined): Optional. When supplied as a String the `censor` option will overwrite keys which are to be redacted. When set to `undefined` the the key will be removed entirely from the object.
    The `censor` option may also be a mapping function. The (synchronous) mapping function is called with the unredacted value. The value returned from the mapping function becomes the applied censor value. Default: `'[Redacted]'`
    value synchronously.
    Default: `'[Redacted]'`
  * `remove` (Boolean): Optional. Instead of censoring the value, remove both the key and the value. Default: `false`

**WARNING**: Never allow user input to define redacted paths.

* See the [redaction ⇗](/docs/redaction.md) documentation.
* See [fast-redact#caveat ⇗](http://github.com/davidmarkclements/fast-redact#caveat)

<a id=opt-serializers></a>
#### `serializers` (Object)

Default: `{err: pino.stdSerializers.err}`

An object containing functions for custom serialization of objects.
These functions should return an JSONifiable object and they
should never throw. When logging an object, each top-level property
matching the exact key of a serializer will be serialized using the defined serializer.

* See [pino.stdSerializers](#pino-stdserializers)

##### `serializers[Symbol.for('pino.*')]` (Function)

Default: `undefined`

The `serializers` object may contain a key which is the global symbol: `Symbol.for('pino.*')`.
This will act upon the complete log object rather than corresponding to a particular key.

#### `base` (Object)

Default: `{pid: process.pid, hostname: os.hostname}`

Key-value object added as child logger to each log line.

Set to `null` to avoid adding `pid`, `hostname` and `name` properties to each log.

#### `enabled` (Boolean)

Default: `true`

Set to `false` to disable logging.

#### `crlf` (Boolean)

Default: `false`

Set to `true` to logs newline delimited JSON with `\r\n` instead of `\n`.

<a id=opt-timestamp></a>
#### `timestamp` (Boolean | Function)

Default: `true`

Enables or disables the inclusion of a timestamp in the
log message. If a function is supplied, it must synchronously return a JSON string
representation of the time, e.g. `,"time":1493426328206` (which is the default).

If set to `false`, no timestamp will be included in the output.
See [stdTimeFunctions](#pino-stdtimefunctions) for a set of available functions
for passing in as a value for this option.

**Caution**: attempting to format time in-process will significantly impact logging performance.

<a id=opt-messagekey></a>
#### `messageKey` (String)

Default: `'msg'`

The string key for the 'message' in the JSON object.

<a id=prettyPrint></a>
#### `prettyPrint` (Boolean | Object)

Default: `false`

Enables pretty printing log logs. This is intended for non-production
configurations. This may be set to a configuration object as outlined in the
[`pino-pretty` documentation](https://github.com/pinojs/pino-pretty).

The options object may additionally contain a `prettifier` property to define
which prettifier module to use. When not present, `prettifier` defaults to
`'pino-pretty'`. Regardless of the value, the specified prettifier module
must be installed as a separate dependency:

```sh
npm install pino-pretty
```

<a id="useLevelLabels"></a>
#### `useLevelLabels` (Boolean)

Default: `false`

Enables printing of level labels instead of level values in the printed logs.
Warning: this option may not be supported by downstream transports.

<a id="changeLevelName"></a>
#### `changeLevelName` (String)

Default: `'level'`

Changes the property `level` to any string value you pass in:
```js
const logger = pino({
  changeLevelName: 'priority'
})
logger.info('hello world')
// {"priority":30,"time":1531257112193,"msg":"hello world","pid":55956,"hostname":"x","v":1}
```

#### `browser` (Object)

Browser only, may have `asObject` and `write` keys. This option is separately
documented in the [Browser API ⇗](/docs/browser.md) documentation.

* See [Browser API ⇗](/docs/browser.md)

<a id="destination"></a>
### `destination` (SonicBoom | WritableStream | String)

Default: `pino.destination(1)` (STDOUT)

The `destination` parameter, at a minimum must be an object with a `write` method.
An ordinary Node.js `stream` can be passed as the destination (such as the result
of `fs.createWriteStream`) but for peak log writing performance it is strongly
recommended to use `pino.destination` or `pino.extreme` to create the destination stream.

```js
// pino.destination(1) by default
const stdoutLogger = require('pino')()

// destination param may be in first position when no options:
const fileLogger = require('pino')( pino.destination('/log/path'))

// use the stderr file handle to log to stderr:
const opts = {name: 'my-logger'}
const stderrLogger = require('pino')(opts, pino.destination(2))

// automatic wrapping in pino.destination
const fileLogger = require('pino')('/log/path')
```

However, there are some special instances where `pino.destination` is not used as the default:

+ When something, e.g a process manager, has monkey-patched `process.stdout.write`.
+ When running on AWS Lambda.

In these cases `process.stdout` is used instead.

* See [`pino.destination`](#pino-destination)
* See [`pino.extreme`](#pino-extreme)

<a id="metadata"></a>
#### `destination[Symbol.for('pino.metadata')]`

Default: `false`

Using the global symbol `Symbol.for('pino.metadata')` as a key on the `destination` parameter and
setting the key it to `true`, indicates that the following properties should be
set on the `destination` object after each log line is written:

* the last logging level as `destination.lastLevel`
* the last logging message as `destination.lastMsg`
* the last logging object as `destination.lastObj`
* the last time as `destination.lastTime`, which will be the partial string returned
  by the time function.
* the last logger instance as `destination.lastLogger` (to support child
  loggers)

For a full reference for using `Symbol.for('pino.metadata')`, see the [`pino-multi-stream` ⇗](https://github.com/pinojs/pino-multi-stream)
module.

The following is a succinct usage example:

```js
const dest = pino.destination('/dev/null')
dest[Symbol.for('pino.metadata')] = true
const logger = pino(dest)
logger.info({a: 1}, 'hi')
const { lastMsg, lastLevel, lastObj, lastTime} = dest
console.log(
  'Logged message "%s" at level %d with object %o at time %s',
  lastMsg, lastLevel, lastObj, lastTime
) // Logged message "hi" at level 30 with object { a: 1 } at time 1531590545089
```

* See [`pino-multi-stream` ⇗](https://github.com/pinojs/pino-multi-stream)

<a id="logger"></a>
## Logger Instance

The logger instance is the object returned by the main exported
[`pino`](#export) function.

The primary purpose of the logger instance is to provide logging methods.

The default logging methods are `trace`, `debug`, `info`, `warn`, `error`, and `fatal`.

Each logging method has the following signature:
`([mergingObject], [message], [...interpolationValues])`.

The parameters are explained below using the `logger.info` method but the same applies to all logging methods.

### Logging Method Parameters

<a id=mergingobject></a>
#### `mergingObject` (Object)

An object can optionally be supplied as the first parameter. Each enumerable key and value
of the `mergingObject` is copied in to the JSON log line.

```js
logger.info({MIX: {IN: true}})
// {"level":30,"time":1531254555820,"pid":55956,"hostname":"x","MIX":{"IN":true},"v":1}
```

<a id=message></a>
#### `message` (String)

A `message` string can optionally be supplied as the first parameter, or
as the second parameter after supplying a `mergingObject`.

By default, the contents of the `message` parameter will be merged into the
JSON log line under the `msg` key:

```js
logger.info('hello world')
// {"level":30,"time":1531257112193,"msg":"hello world","pid":55956,"hostname":"x","v":1}
```

The `message` parameter takes precedence over the `mergedObject`.
That is, if a `mergedObject` contains a `msg` property, and a `message` parameter
is supplied in addition, the `msg` property in the output log will be the value of
the `message` parameter not the value of the `msg` property on the `mergedObject`.

The `messageKey` option can be used at instantiation time to change the namespace
from `msg` to another string as preferred.

The `message` string may contain a printf style string with support for
the following placeholders:

* `%s` – string placeholder
* `%d` – digit placeholder
* `%O`, `%o` and `%j` – object placeholder

Values supplied as additional arguments to the logger method will
then be interpolated accordingly.

* See [`messageKey` pino option](#opt-messagekey)
* See [`...interpolationValues` log method parameter](#interpolationvalues)

<a id=interpolationvalues></a>
#### `...interpolationValues` (Any)

All arguments supplied after `message` are serialized and interpolated according
to any supplied printf-style placeholders (`%s`, `%d`, `%o`|`%O`|`%j`)
or else concatenated together with the `message` string to form the final
output `msg` value for the JSON log line.

```js
logger.info('hello', 'world')
// {"level":30,"time":1531257618044,"msg":"hello world","pid":55956,"hostname":"x","v":1}
```

```js
logger.info('hello', {worldly: 1})
// {"level":30,"time":1531257797727,"msg":"hello {\"worldly\":1}","pid":55956,"hostname":"x","v":1}
```

```js
logger.info('%o hello', {worldly: 1})
// {"level":30,"time":1531257826880,"msg":"{\"worldly\":1} hello","pid":55956,"hostname":"x","v":1}
```

* See [`message` log method parameter](#message)

<a id="trace"></a>
### `logger.trace([mergingObject], [message], [...interpolationValues])`

Write a `'trace'` level log, if the configured [`level`](#level) allows for it.

* See [`mergingObject` log method parameter](#mergingobject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationvalues)

<a id="debug"></a>
### `logger.debug([mergingObject], [message], [...interpolationValues])`

Write a `'debug'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingobject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationvalues)

<a id="info"></a>
### `logger.info([mergingObject], [message], [...interpolationValues])`

Write an `'info'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingobject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationvalues)

<a id="warn"></a>
### `logger.warn([mergingObject], [message], [...interpolationValues])`

Write a `'warn'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingobject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationvalues)

<a id="error"></a>
### `logger.error([mergingObject], [message], [...interpolationValues])`

Write a `'error'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingobject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationvalues)

<a id="fatal"></a>
### `logger.fatal([mergingObject], [message], [...interpolationValues])`

Write a `'fatal'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingobject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationvalues)


<a id="child"></a>
### `logger.child(bindings) => logger`

The `logger.child` method allows for the creation of stateful loggers,
where key-value pairs can be pinned to a logger causing them to be output
on every log line.

Child loggers use the same output stream as the parent and inherit
the current log level of the parent at the time they are spawned.

The log level of a child is mutable. It can be set independently
of the parent either by setting the [`level`](#level) accessor after creating
the child logger or using the reserved [`bindings.level`](#bindingslevel-string) key.

#### `bindings` (Object)

An object of key-value pairs to include in every log line output
via the returned child logger.

```js
const child = logger.child({ MIX: {IN: 'always'} })
child.info('hello')
// {"level":30,"time":1531258616689,"msg":"hello","pid":64849,"hostname":"x","MIX":{"IN":"always"},"v":1}
child.info('child!')
// {"level":30,"time":1531258617401,"msg":"child!","pid":64849,"hostname":"x","MIX":{"IN":"always"},"v":1}
```

The `bindings` object may contain any key except for reserved configuration keys `level` and `serializers`.

##### `bindings.level` (String)

If a `level` property is present in the `bindings` object passed to `logger.child`
it will override the child logger level.

```js
const logger = pino()
logger.debug('nope') // will not log, since default level is info
const child = logger.child({foo: 'bar', level: 'debug'})
child.debug('debug!') // will log as the `level` property set the level to debug
```

##### `bindings.serializers` (Object)

Child loggers inherit the [serializers](#opt-serializers) from the parent logger.

Setting the `serializers` key of the `bindings` object will override
any configured parent serializers.

```js
const logger = require('pino')()
logger.info({test: 'will appear'})
// {"level":30,"time":1531259759482,"pid":67930,"hostname":"x","test":"will appear","v":1}
const child = logger.child({serializers: {test: () => `child-only serializer`}})
child.info({test: 'will be overwritten'})
// {"level":30,"time":1531259784008,"pid":67930,"hostname":"x","test":"child-only serializer","v":1}
```

* See [`serializers` option](#opt-serializers)
* See [pino.stdSerializers](#pino-stdSerializers)

<a id="bindings"></a>
### `logger.bindings()`

Returns an object containing all the current bindings, cloned from the ones passed in via `logger.child()`.
```js
const child = logger.child({ foo: 'bar' })
console.log(child.bindings())
// { foo: 'bar' }
const anotherChild = child.child({ MIX: { IN: 'always' } })
console.log(child.bindings())
// { foo: 'bar', MIX: { IN: 'always' } }
```

<a id="flush"></a>
### `logger.flush()`

Flushes the content of the buffer when using a `pino.extreme` destination.

This is an asynchronous, fire and forget, operation.

The use case is primarily for Extreme mode logging, which may hold up to
4KiB of logs. The `logger.flush` method can be used to flush the logs
on an long interval, say ten seconds. Such a strategy can provide an
optimium balance between extremely efficient logging at high demand periods
and safer logging at low demand periods.

* See [`pino.extreme`](#pino-extreme)
* See [`destination` parameter](#destination)
* See [Extreme mode ⇗](/docs/extreme.md)

<a id="level"></a>
### `logger.level` (String) [Getter/Setter]

Set this property to the desired logging level.

The core levels and their values are as follows:

|            |       |       |      |      |       |       |          |
|:-----------|-------|-------|------|------|-------|-------|---------:|
| **Level:** | trace | debug | info | warn | error | fatal | silent   |
| **Value:** | 10    | 20    | 30   | 40   | 50    | 60    | Infinity |

The logging level is a *minimum* level based on the associated value of that level.

For instance if `logger.level` is `info` *(30)* then `info` *(30)*, `warn` *(40)*, `error` *(50)* and `fatal` *(60)* log methods will be enabled but the `trace` *(10)* and `debug` *(20)* methods, being less than 30, will not.

The `silent` logging level is a specialized level which will disable all logging,
there is no `silent` log method.

<a id="islevelenabled"></a>
### `logger.islevelenabled(level)`

A utility method for determining if a given log level will write to the destination.

#### `level` (String)

The given level to check against:

```js
if (logger.isLevelEnabled('debug')) logger.debug('conditional log')
```

#### `levelLabel` (String)

Defines the method name of the new level.

* See [`logger.level`](#level)

#### `levelValue` (Number)

Defines the associated minimum threshold value for the level, and
therefore where it sits in order of priority among other levels.

* See [`logger.level`](#level)

<a id="levelVal"></a>
### `logger.levelVal` (Number)

Supplies the integer value for the current logging level.

```js
if (logger.levelVal === 30) {
  console.log('logger level is `info`')
}
```

<a id="levels"></a>
### `logger.levels` (Object)

Levels are mapped to values to determine the minimum threshold that a
logging method should be enabled at (see [`logger.level`](#level)).

The `logger.levels` property holds the mappings between levels and values,
and vice versa.

```sh
$ node -p "require('pino')().levels"
```

```js
{ labels:
   { '10': 'trace',
     '20': 'debug',
     '30': 'info',
     '40': 'warn',
     '50': 'error',
     '60': 'fatal' },
  values:
   { fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10 } }
```

* See [`logger.level`](#level)

<a id="serializers"></a>
### logger\[Symbol.for('pino.serializers')\]

Returns the serializers as applied to the current logger instance. If a child logger did not
register it's own serializer upon instantiation the serializers of the parent will be returned.

<a id="level-change"></a>
### Event: 'level-change'

The logger instance is also an [`EventEmitter ⇗`](https://nodejs.org/dist/latest/docs/api/events.html#events_class_eventemitter)

A listener function can be attached to a logger via the `level-change` event

The listener is passed four arguments:

* `levelLabel` – the new level string, e.g `trace`
* `levelValue` – the new level number, e.g `10`
* `previousLevelLabel` – the prior level string, e.g `info`
* `previousLevelValue` – the prior level numbebr, e.g `30`

```js
const logger = require('pino')()
logger.on('level-change', (lvl, val, prevLvl, prevVal) => {
  console.log('%s (%d) was changed to %s (%d)', lvl, val, prevLvl, prevVal)
})
logger.level = 'trace' // trigger event
```

<a id="version"></a>
### `logger.version` (String)

Exposes the Pino package version. Also available on the exported `pino` function.

* See [`pino.version`](#pino-version)

<a id="log_version"></a>
### `logger.LOG_VERSION` (Number)

Holds the current log format version as output in the `v` property of each log record.
Also available on the exported `pino` function.

* See [`pino.LOG_VERSION`](#pino-LOG_VERSION)

## Statics

<a id="pino-destination"></a>
### `pino.destination([target]) => SonicBoom`

Create a Pino Destination instance: a stream-like object with
significantly more throughput (over 30%) than a standard Node.js stream.

```js
const pino = require('pino')
const logger = pino(pino.destination('./my-file'))
const logger2 = pino(pino.destination())
```

The `pino.destination` method may be passed a file path or a numerical file descriptor.
By default, `pino.destination` will use `process.stdout.fd` (1) as the file descriptor.

`pino.destination` is implemented on [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom).

A `pino.destination` instance can also be used to reopen closed files
(for example, for some log rotation scenarios), see [Reopening log files](/docs/help.md#reopening).

* See [`destination` parameter](#destination)
* See [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom)
* See [Reopening log files](/docs/help.md#reopening)

<a id="pino-extreme"></a>
### `pino.extreme([target]) => SonicBoom`

Create an extreme mode destination. This yields an additional 60% performance boost.
There are trade-offs that should be understood before usage.

```js
const pino = require('pino')
const logger = pino(pino.extreme('./my-file'))
const logger2 = pino(pino.extreme())
```

The `pino.extreme` method may be passed a file path or a numerical file descriptor.
By default, `pino.extreme` will use `process.stdout.fd` (1) as the file descriptor.

`pino.extreme` is implemented with the [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom)
module.

A `pino.extreme` instance can also be used to reopen closed files
(for example, for some log rotation scenarios), see [Reopening log files](/docs/help.md#reopening).

On AWS Lambda we recommend to call `extreme.flushSync()` at the end
of each function execution to avoid losing data.

* See [`destination` parameter](#destination)
* See [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom)
* See [Extreme mode ⇗](/docs/extreme.md)
* See [Reopening log files](/docs/help.md#reopening)

<a id="pino-final"></a>

### `pino.final(logger, [handler]) => Function | FinalLogger`

The `pino.final` method can be used to acquire a final logger instance
or create an exit listener function.

The `finalLogger` is a specialist logger that synchronously flushes
on every write. This is important to guarantee final log writes,
both when using `pino.extreme` target.

Since final log writes cannot be guaranteed with normal Node.js streams,
if the `destination` parameter of the `logger` supplied to `pino.final`
is a Node.js stream `pino.final` will throw.

The use of `pino.final` with `pino.destination` is not needed, as
`pino.destination` writes things synchronously.

#### `pino.final(logger, handler) => Function`

In this case the `pino.final` method supplies an exit listener function that can be
supplied to process exit events such as `exit`, `uncaughtException`,
`SIGHUP` and so on.

The exit listener function will call the supplied `handler` function
with an error object (or else `null`), a `finalLogger` instance followed
by any additional arguments the `handler` may be called with.

```js
process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
  finalLogger.error(err, 'uncaughtException')
  process.exit(1)
}))
```

#### `pino.final(logger) => FinalLogger`

In this case the `pino.final` method returns a finalLogger instance.

```js
var finalLogger = pino.final(logger)
finalLogger.info('exiting...')
```

* See [`destination` parameter](#destination)
* See [Exit logging help](/docs/help.md#exit-logging)
* See [Extreme mode ⇗](/docs/extreme.md)
* See [Log loss prevention ⇗](/docs/extreme.md#log-loss-prevention)

<a id="pino-stdserializers"></a>
### `pino.stdSerializers` (Object)

The `pino.stdSerializers` object provides functions for serializing objects common to many projects. The standard serializers are directly imported from [pino-std-serializers](https://github.com/pinojs/pino-std-serializers).

* See [pino-std-serializers ⇗](https://github.com/pinojs/pino-std-serializers)

<a id="pino-stdtimefunctions"></a>
### `pino.stdTimeFunctions` (Object)

The [`timestamp`](#opt-timestamp) option can accept a function which determines the
`timestamp` value in a log line.

The `pino.stdTimeFunctions` object provides a very small set of common functions for generating the
`timestamp` property. These consist of the following

* `pino.stdTimeFunctions.epochTime`: Milliseconds since Unix epoch (Default)
* `pino.stdTimeFunctions.unixTime`: Seconds since Unix epoch
* `pino.stdTimeFunctions.nullTime`: Clears timestamp property (Used when `timestamp: false`)

* See [`timestamp` option](#opt-timestamp)

<a id="pino-symbols"></a>
### `pino.symbols` (Object)

For integration purposes with ecosystem and third party libraries `pino.symbols`
exposes the symbols used to hold non-public state and methods on the logger instance.

Access to the symbols allows logger state to be adjusted, and methods to be overridden or
proxied for performant integration where necessary.

The `pino.symbols` object is intended for library implementers and shouldn't be utilized
for general use.

<a id="pino-version"></a>
### `pino.version` (String)

Exposes the Pino package version. Also available on the logger instance.

* See [`logger.version`](#version)

<a id="pino-log_version"></a>
### `pino.LOG_VERSION` (Number)

Holds the current log format version as output in the `v` property of each log record. Also available on the logger instance.

* See [`logger.LOG_VERSION`](#log_version)
