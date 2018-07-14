# API 

* [pino() => logger](#export)
  * [options](#options)
  * [destination](#destination)
* [Logger Instance](#logger)
  * [logger.trace()](#trace)
  * [logger.debug()](#debug)
  * [logger.info()](#info)
  * [logger.warn()](#warn)
  * [logger.error()](#error)
  * [logger.fatal()](#fatal)
  * [logger.child()](#child)
  * [logger.flush()](#flush)
  * [logger.level](#level)
  * [logger.isLevelEnabled()](#isLevelEnabled)
  * [logger.addLevel()](#addLevel)
  * [logger.levels](#levels)
  * [Event: 'level-change'](#level-change)
  * [logger.version](#version)
  * [logger.LOG_VERSION](#log_version)
* [Statics](#statics)
  * [pino.destination()](#pino-destination)
  * [pino.extreme()](#pino-extreme)
  * [pino.stdSerializers](#pino-stdSerializers)
  * [pino.stdTimeFunctions](#pino-stdTimeFunctions)
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

One of `'fatal'`, `'error'`, `'warn'`, `'info`', `'debug'`, `'trace'` or `silent`.
 
Additional levels can be added to the instance via the `logger.addLevel` method or 
at instantiation time with the `customLevels` property. 

* See [`logger.addLevel`](#addLevel)
* See [`customLevels` option](#opt-customlevels)

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

#### `redact` (Array|Object): 

Default: `undefined`

As an array, the `redact` option specifies paths that should 
have their values redacted from any log output. 

Each path must be a string using a syntax which corresponds to JavaScript dot and bracket notation.

If an object is supplied, three options can be specified: 
  * `paths` (array): Required. An array of paths
  * `censor` (String): Optional. A value to overwrite key which are to be redacted. Default: `'[Redacted]'` 
  * `remove` (Boolean): Optional. Instead of censoring the value, remove both the key and the value. Default: `false`

**WARNING**: Never allow user input to define redacted paths.

* See the [redaction ⇗](redaction.md) documentation.
* See [fast-redact#caveat ⇗](http://github.com/davidmarkclements/fast-redact#caveat)

<a id=opt-serializers></a>
#### `serializers` (Object)

Default: `{err: pino.stdSerializers.err}`

An object containing functions for custom serialization of objects.
These functions should return an JSONifiable object and they
should never throw. When logging an object, each top-level property 
matching the exact key of a serializer will be serialized using the defined serializer.

* See [pino.stdSerializers](#pino-stdSerializers)

##### `serializers[Symbol.for('pino.*')]` (Function)

Default: `undefined`

The `serializers` object may contain a key which is the global symbol: `Symbol.for('pino.*')`. 
This will act upon the complete log object rather than corresponding to a particular key.

#### `base` (Object)

Default: `{pid: process.pid, hostname: os.hostname}`

Key-value object added as child logger to each log line. 

Set to `null` to avoid adding `pid` and `hostname` properties to each log.

#### `enabled` (Boolean) 

Default: `true`

Set to `false` to disable logging.

#### `safe` (Boolean)

Default: `true`

Avoid throwing caused by circular references in the object tree.

#### `crlf` (Boolean)

Default: `false`

Set to `true` to logs newline delimited JSON with `\r\n` instead of `\n`.

<a id=opts-timestamp></a>
#### `timestamp` (Boolean|Function)

Default: `true`

Enables or disables the inclusion of a timestamp in the
log message. If a function is supplied, it must synchronously return a JSON string
representation of the time, e.g. `,"time":1493426328206` (which is the default).

If set to `false`, no timestamp will be included in the output.
See [stdTimeFunctions](#stdTimeFunctions) for a set of available functions
for passing in as a value for this option. 

**Caution**: attempting to format time in-process will significantly impact logging performance.

<a id=opt-messageKey></a>  
#### `messageKey` (String)

Default: `'msg'`

The string key for the 'message' in the JSON object. 

#### `onTerminated` (Function)

Default: `(evt, err) => err ? process.exit(1) : process.exit(0)`

This function will be invoked during process shutdown when `extreme` is set to `true`.

The signature of the function is `onTerminated(eventName, err)`. If you do not specify a function, Pino will
invoke `process.exit(0)` when no error has occurred, and `process.exit(1)` otherwise. 

If a function is specified it **must** perform only synchronous operations at this point and
then exit the process.

* See [Extreme mode ⇗](/docs/extreme.md)

<a id=prettyPrint></a>
#### `prettyPrint` (Boolean|Object)

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

#### `browser` (Object)

Browser only, may have `asObject` and `write` keys

* See [Browser API](/docs/browser.md)

<a id="destination"></a>
### `destination` (SonicBoom | WritableStream)

Default: `pino.destination(1)` (STDOUT)

The `destination` parameter, at a minimum must be an object with a `write` method.
An ordinary Node.js `stream` can be passed as the destination (such as the result
of `fs.createWriteStream`) but for peak log writing performance it is strongly 
recommended to use `pino.destination` or `pino.extreme` to create the destination stream.

* See [`pino.destination`](#pino-destination) 
* See [`pino.extreme`](#pino-extreme) 

#### `destination[Symbol.for('pino.metadata')]`

Default: `false`

Assigning the `pino.metadata` symbol key to `true` on the `destination` parameter  
indicates after each log line is written, the following properties should be 
set on the `destination` object:

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
const logger = pino({}, {
  [Symbol.for('pino.metadata')]: true,
  write: function (chunk) {
    console.log('lastLevel', this.lastLevel)
    console.log('lastMsg', this.lastMsg)
    console.log('lastObj', this.lastObj)
    console.log('lastLogger', this.lastLogger)
    console.log('line', chunk)
  }
})
```

* See [`pino-multi-stream` ⇗](https://github.com/pinojs/pino-multi-stream)

<a id="logger"></a>
## Logger Instance

The logger instance is the object returned by the main exported
[`pino`](#export) function.

The primary purpose of the logger instance is to provide logging methods.

The default logging methods are `trace`, `debug`, `info`, `warn`, and `fatal`. 

Each logging method has the following signature: 
`([mergingObject], [message], [...interpolationValues])`.

The parameters will be explained using `logger.info` but the same applies to all logging methods.

<a id=mergingObject></a>
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
* `%d` – digit placeholder)
* `%O`, `%o` and `%j` – object placeholder

Values supplied as additional arguments to the logger method will
then be interpolated accordingly. 

* See [`messageKey` pino option](#opt-messageKey)
* See [`...interpolationValues` log method parameter](#interpolatedValues)

<a id=interpolationValues></a>
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

* See [`mergingObject` log method parameter](#mergingObject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationValues)

<a id="debug"></a>
### `logger.debug([mergingObject], [message], [...interpolationValues])`

Write a `'debug'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingObject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationValues)

<a id="info"></a>
### `logger.info([mergingObject], [message], [...interpolationValues])`

Write an `'info'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingObject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationValues) 

<a id="warn"></a>
### `logger.warn([mergingObject], [message], [...interpolationValues])`

Write a `'warn'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingObject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationValues)

<a id="error"></a>
### `logger.error([mergingObject], [message], [...interpolationValues])`

Write a `'error'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingObject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationValues)

<a id="fatal"></a>
### `logger.fatal([mergingObject], [message], [...interpolationValues])`

Write a `'fatal'` level log, if the configured `level` allows for it.

* See [`mergingObject` log method parameter](#mergingObject)
* See [`message` log method parameter](#message)
* See [`...interpolationValues` log method parameter](#interpolationValues)


<a id="child"></a>
### `logger.child(bindings) => logger`

The `logger.child` method allows for the creation of stateful loggers, 
where key-value pairs can be pinned to a logger causing them to be output
on every log line.

Child loggers use the same output stream as the parent and inherit
the current log level of the parent at the time they are spawned.

The log level of a child is mutable. It can be set independently 
of the parent either by setting the [`level`](#level) accessor after creating 
the child logger or using the reserved [`bindings.level`](#bindings-level) key.

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

Child loggers inherit the [serializers](#serializers-opt) from the parent logger.

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

<a id="flush"></a>
### `logger.flush()`

Flushes the content of the buffer when using a `pino.extreme` destination.

It has no effect if extreme mode is not enabled.

* See [`pino.extreme`](#pino-extreme)
* See [Extreme mode ⇗](extreme.md)

<a id="level"></a>
### `logger.level` (String) [Getter/Setter]

Set this property to the desired logging level. 

The core levels and their values are as follows: 

|                                                                     |
|:-------------------------------------------------------------------:|
| **Level:** | trace | debug | info | warn | error | fatal | silent   |
| **Value:** | 10    | 20    | 30   | 40   | 50    | 60    | Infinity |

The logging level is a *minimum* level based on the associated value of that level.

For instance if `logger.level` is `info` *(30)* then `info` *(30)*, `warn` *(40)*, `error` *(50)* and `fatal` *(60)* log methods will be enabled but the `trace` *(10)* and `debug` *(20)* methods, being less than 30, will not.

The `silent` logging level is a specialized level which will disable all logging,
there is no `silent` log method.

<a id="isLevelEnabled"></a>
### `logger.isLevelEnabled(level)`

A utility method for determining if a given log level will write to the destination.

#### `level` (String)

The given level to check against:

```js
if (logger.isLevelEnabled('debug')) logger.debug('conditional log')
```

<a id="addLevel"></a>
### `logger.addLevel(levelLabel, levelValue) => Boolean`

Defines a new level on the logger instance.

Returns `true` on success or `false` if there was a conflict (level name or
value already exist).

```js
logger.addLevel('myLevel', 35)
logger.myLevel('a message')
// {"level":35,"time":1531261498686,"msg":"a message","pid":67930,"hostname":"x","v":1}
```

When using this method, the current level of the logger instance does not change.
To do so, use the [loggerlevel](#level) property after adding the custom level.

* See [`logger.level`](#level)

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

<a id="level-change"></a>
## Event: 'level-change'

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
## `logger.version` (String)

Exposes the Pino package version. Also available on the exported `pino` function.

* See [`pino.version`](#pino-version)

<a id="log_version"></a>
## `logger.LOG_VERSION` (Number)

Holds the current log format version as output in the `v` property of each log record.
Also available on the exported `pino` function.

* See [`pino.LOG_VERSION`](#pino-LOG_VERSION)

## Statics

<a id="pino-destination"></a>
### `pino.destination([dest]) => SonicBoom`

Create a pino destination.
It returns a stream-like object with significantly more throughput than a
standard Node.js stream.

```js
const pino = require('pino')
const logger = pino(pino.destination('./my-file'))
const logger2 = pino(pino.destination())
```

`dest` could be either a file or a file descriptor. If it is omitted, it
will be `process.stdout.fd`.

The default `stream` is a destination.

`pino.destination()` is implemented on [`sonic-boom`  ⇗]](https://github.com/mcollina/sonic-boom).

<a id="pino-extreme"></a>
### `pino.extreme([dest]) => SonicBoom`

Create an extreme mode destination. This yields an additional 60% performance boost.
There are trade-offs that should be understood before usage.

```js
const pino = require('pino')
const logger = pino(pino.extreme('./my-file'))
const logger2 = pino(pino.extreme())
```

`dest` can be either a file or a file descriptor. If it is omitted, it
will be `process.stdout.fd`.

`pino.extreme()` is implemented with the [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom)
module.

* See [Extreme mode ⇗](extreme.md).
* See [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom)

<a id="stdSerializers"></a>
### `pino.stdSerializers` (Object)

Tthe `pino.stdSerializers` object provides functions for serializing objects common to many projects. The serializers are directly imported from [pino-std-serializers](https://github.com/pinojs/pino-std-serializers).

* See [pino-std-serializers ⇗](https://github.com/pinojs/pino-std-serializers)

<a id="stdTimeFunctions"></a>
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

Access to the symbols allows logger state to be adjusted, and methods to be overriden or
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