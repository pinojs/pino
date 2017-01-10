# Table of Contents

+ [Constructor](#constructor)
+ [Logger](#logger)
  * [.child](#child)
  * [.level](#level)
  * [.fatal](#fatal)
  * [.error](#error)
  * [.warn](#warn)
  * [.info](#info)
  * [.debug](#debug)
  * [.trace](#trace)
  * [.flush](#flush)
  * [level-change (event)](#level-change)
  * [.levels.values](#levelValues)
  * [.levels.labels](#levelLabels)
  * [LOG_VERSION](#log_version)
  * [.stdSerializers](#stdSerializers)
    + [.req](#reqSerializer)
    + [.res](#resSerializer)
    + [.err](#errSerializer)
  * [.pretty](#pretty)
  * [.addLevel](#addLevel)

# module.exports

<a id="constructor"></a>
## .pino([options], [stream])

### Parameters:
+ `options` (object):
  * `safe` (boolean): avoid error caused by circular references in the object tree.
    Default: `true`.
  * `name` (string): the name of the logger. Default: `undefined`.
  * `serializers` (object): an object containing functions for custom serialization
    of objects. These functions should return an JSONifiable object and they
    should never throw. Each property name of this object will match to a
    property name is logged objects.
  * `timestamp` (boolean): Enables or disables the inclusion of a timestamp in the
    log message. `slowtime` has no effect if this option is set to `false`.
    Defaults: `true`.
  * `slowtime` (boolean): Outputs ISO time stamps (`'2016-03-09T15:18:53.889Z'`)
    instead of Epoch time stamps (`1457536759176`). **WARNING**: This option
    carries a 25% performance drop. We recommend using default Epoch timestamps and transforming logs after if required. The `pino -t` command will do this for
    you (see [CLI](cli.md)). Default: `false`.
  * `extreme` (boolean): Enables extreme mode, yields an additional 60% performance
    (from 250ms down to 100ms per 10000 ops). There are trade-off's should be
    understood before usage. See [Extreme mode explained](extreme.md). Default: `false`.
  * `level` (string): one of `'fatal'`, `'error'`, `'warn'`, `'info`', `'debug'`,
    `'trace'`; also `'silent'` is supported to disable logging. Any other value
    defines a custom level and requires supplying a level value via `levelVal`.
    Default: 'info'.
  * `levelVal` (integer): when defining a custom log level via `level`, set to an
    integer value to define the new level. Default: `undefined`.
  * `enabled` (boolean): enables logging. Default: `true`
+ `stream` (Writable): a writable stream where the logs will be written.
  Deafult: `process.stdout`

### Example:
```js
'use strict'

var pino = require('pino')
var logger = pino({
  name: 'myapp',
  safe: true,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
})
```
### Discussion:
Returns a new [logger](#logger) instance.

<a id="logger"></a>
# Logger

<a id="child"></a>
## .child(bindings)

### Parameters:
+ `bindings` (object): an object of key-value pairs to include in log lines
  as properties.

### Example:
```js
logger.child({ a: 'property' }).info('hello child!')
// generates
// {"pid":46497,"hostname":"MacBook-Pro-di-Matteo.local","level":30,"msg":"hello child!","time":1458124707120,"v":0,"a":"property"}
```

### Discussion:
Creates a child logger, setting all key-value pairs in `bindings` as properties
in the log lines. All serializers will be applied to the given pair.

Child loggers use the same output stream as the parent and inherit
the current log level of the parent at the time they are spawned.

From v2.x.x the log level of a child is mutable (whereas in
v1.x.x it was immutable), and can be set independently of the parent.
If a `level` property is present in the object passed to `child` it will
override the child logger level.

For example:

```
var logger = pino()
logger.level = 'error'
logger.info('nope') //does not log
var child = logger.child({foo: 'bar'})
child.info('nope again') //does not log
child.level = 'info'
child.info('hooray') //will log
logger.info('nope nope nope') //will not log, level is still set to error
logger.child({ foo: 'bar', level: 'debug' }).debug('debug!')
```

Child loggers inherit the serializers from the parent logger but it is
possible to override them.

For example:

```
var pino = require('./pino')

var customSerializers = {
  test: function () {
    return 'this is my serializer'
  }
}
var child = pino().child({serializers: customSerializers})

child.info({test: 'should not show up'})
```

Will produce the following output:

```
{"pid":7971,"hostname":"mycomputer.local","level":30,"time":1469488147985,"test":"this is my serializer","v":1}
```

Also from version 2.x.x we can spawn child loggers from child loggers, for instance:

```
var logger = pino()
var child = logger.child({father: true})
var childChild = child.child({baby: true})
```

Child logger creation is fast:

```
benchBunyanCreation*10000: 1291.332ms
benchBoleCreation*10000: 1630.542ms
benchPinoCreation*10000: 352.330ms
benchPinoExtremeCreation*10000: 102.282ms
```

Logging through a child logger has little performance penalty:

```
benchBunyanChild*10000: 1343.933ms
benchBoleChild*10000: 1605.969ms
benchPinoChild*10000: 334.573ms
benchPinoExtremeChild*10000: 152.792ms
```

Spawning children from children has negligible overhead:

```
benchBunyanChildChild*10000: 1397.202ms
benchPinoChildChild*10000: 338.930ms
benchPinoExtremeChildChild*10000: 150.143ms
```

<a id="level"></a>
## .level

### Example:
```
logger.level = 'info'
```

### Discussion:

Set this property to the desired logging level. In order of priority, available
levels are:

  1. <a href="#fatal">`'fatal'`</a>
  2. <a href="#error">`'error'`</a>
  3. <a href="#warn">`'warn'`</a>
  4. <a href="#info">`'info'`</a>
  5. <a href="#debug">`'debug'`</a>
  6. <a href="#trace">`'trace'`</a>

The logging level is a *minimum* level. For instance if `logger.level` is
`'info'` then all `'fatal'`, `'error'`, `'warn'`, and `'info'` logs will be enabled.

You can pass `'silent'` to disable logging.

<a id="fatal"></a>
## .fatal([obj], msg, [...])

### Parameters:
+ `obj` (object): object to be serialized
+ `msg` (string): the log message to write
+ `...` (*): format string values when `msg` is a format string

### Discussion:
Log at `'fatal'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`][util-format].

[util-format]: https://nodejs.org/api/util.html#util_util_format_format

<a id="error"></a>
## .error([obj], msg, [...])

### Parameters:
+ `obj` (object): object to be serialized
+ `msg` (string): the log message to write
+ `...` (*): format string values when `msg` is a format string

### Discussion:
Log at `'error'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`][util-format].

<a id="warn"></a>
## .warn([obj], msg, [...])

### Parameters:
+ `obj` (object): object to be serialized
+ `msg` (string): the log message to write
+ `...` (*): format string values when `msg` is a format string

### Discussion:
Log at `'warn'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`][util-format].

<a id="info"></a>
## .info([obj], msg, [...])

### Parameters:
+ `obj` (object): object to be serialized
+ `msg` (string): the log message to write
+ `...` (*): format string values when `msg` is a format string

### Discussion:
Log at `'info'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`][util-format].

<a id="debug"></a>
## .debug([obj], msg, [...])

### Parameters:
+ `obj` (object): object to be serialized
+ `msg` (string): the log message to write
+ `...` (*): format string values when `msg` is a format string

### Discussion:
Log at `'debug'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`][util-format].

<a id="trace"></a>
## .trace([obj], msg, [...])

### Parameters:
+ `obj` (object): object to be serialized
+ `msg` (string): the log message to write
+ `...` (*): format string values when `msg` is a format string

### Discussion:
Log at `'trace'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`][util-format].

<a id="flush"></a>
## .flush()

### Discussion:
Flushes the content of the buffer in [extreme mode](extreme.md). It has no effect if
extreme mode is not enabled.

<a id="level-change"></a>
## .on('level-change', fn)

### Example:
```js
var listener = function (lvl, val, prevLvl, prevVal) {
  console.log(lvl, val, prevLvl, prevVal)
}
logger.on('level-change', listener)
logger.level = 'trace' // trigger console message
logger.removeListener('level-change', listener)
logger.level = 'info' // no message, since listener was removed
```

### Discussion:
Registers a listener function that is triggered when the level is changed.

The listener is passed four arguments: `levelLabel`, `levelValue`,
`previousLevelLabel`, `previousLevelValue`.

**Note:** When browserified, this functionality will only be available if the
`events` module has been required elsewhere (e.g. if you're using streams
in the browser). This allows for a trade-off between bundle size and functionality.

<a id="levelValues"></a>
## .levels.values

### Example:
```js
pino.levels.values.error === 50 // true
```

### Discussion:
Returns the mappings of level names to their respective internal number
representation. This property is available as a static property or as an
instance property.

<a id="levelLabels"></a>
## .levels.labels

### Example:
```js
pino.levels.labels[50] === 'error' // true
```

### Discussion:
Returns the mappings of level internal level numbers to their string
representations. This property is available as a static property or as an
instance property.

<a id="log_version"></a>
## .LOG_VERSION

### Discussion:
Read only. Holds the current log format version (as output in the `v`
property of each log record). This property is available as a static property
or as an instance property.

<a id="stdSerializers"></a>
## .stdSerializers

Available as a static property, the `stdSerializers` provide functions for
serializing objects common to many projects.

<a id="reqSerializer"></a>
### .req

Generates a JSONifiable object from the HTTP `request` object passed to
the `createServer` callback of Node's HTTP server.

It returns an object in the form:

```js
{
  pid: 93535,
  hostname: 'your host',
  level: 30,
  msg: 'my request',
  time: '2016-03-07T12:21:48.766Z',
  v: 0,
  req: {
    method: 'GET',
    url: '/',
    headers: {
      host: 'localhost:50201',
      connection: 'close'
    },
    remoteAddress: '::ffff:127.0.0.1',
    remotePort: 50202
  }
}
```

<a id="resSerializer"></a>
### .res

Generates a JSONifiable object from the HTTP `response` object passed to
the `createServer` callback of Node's HTTP server.

It returns an object in the form:

```js
{
  pid: 93581,
  hostname: 'myhost',
  level: 30,
  msg: 'my response',
  time: '2016-03-07T12:23:18.041Z',
  v: 0,
  res: {
    statusCode: 200,
    header: 'HTTP/1.1 200 OK\r\nDate: Mon, 07 Mar 2016 12:23:18 GMT\r\nConnection: close\r\nContent-Length: 5\r\n\r\n'
  }
}
```

<a id="errSerializer"></a>
### .err

Serializes an `Error` object if passed in as an property.

```js
{
  "pid": 40510,
  "hostname": "MBP-di-Matteo",
  "level": 50,
  "msg": "an error",
  "time": 1459433282301,
  "v": 1,
  "type": "Error",
  "stack": "Error: an error\n    at Object.<anonymous> (/Users/matteo/Repositories/pino/example.js:16:7)\n    at Module._compile (module.js:435:26)\n    at Object.Module._extensions..js (module.js:442:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:313:12)\n    at Function.Module.runMain (module.js:467:10)\n    at startup (node.js:136:18)\n    at node.js:963:3"
}
```

<a id="pretty"></a>
## .pretty([options])

### Parameters:
+ `options` (object):
  * `timeTransOnly` (boolean): if set to `true`, it will only covert the unix
  timestamp to ISO 8601 date format, and reserialize the JSON (equivalent to `pino -t`).
  * `formatter` (function): a custom function to format the line, is passed the
  JSON object as an argument and should return a string value.

### Example:
```js
'use strict'

var pino = require('pino')
var pretty = pino.pretty()
pretty.pipe(process.stdout)
var log = pino({
  name: 'app',
  safe: true
}, pretty)

log.child({ widget: 'foo' }).info('hello')
log.child({ widget: 'bar' }).warn('hello 2')
```

### Discussion:
Provides access to the [CLI](cli.md) log prettifier as an API.

<a id="addLevel"></a>
## .addLevel(name, lvl)

Defines a new level for new logger instances.
Returns `true` on success and `false` if there was a conflict (level name or number already exists).

### Example:
```js
var pino = require('pino')
pino.addLevel('myLevel', 35)
var log = pino({level: 'myLevel'})
log.myLevel('a message')
```
