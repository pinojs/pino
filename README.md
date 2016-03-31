# pino

[Extremely fast](#benchmarks) node.js logger, inspired by Bunyan.
It also includes a shell utility to pretty-print its log files.

![cli](demo.png)

* [Installation](#install)
* [Usage](#usage)
* [Benchmarks](#benchmarks)
* [API](#api)
* [How do I rotate log files?](#rotate)
* [How to use Transports with Pino](#transports)
* [Changelog](#changelog)
* [Acknowledgements](#acknowledgements)
* [License](#license)

## Install

```
npm install pino --save
```

## Usage

```js
'use strict'

var pino = require('./')()
var info = pino.info
var error = pino.error

info('hello world')
error('this is at error level')
info('the answer is %d', 42)
info({ obj: 42 }, 'hello world')
info({ obj: 42, b: 2 }, 'hello world')
info({ obj: { aa: 'bbb' } }, 'another')
setImmediate(info, 'after setImmediate')
error(new Error('an error'))
```

This produces:

```
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1457531561635,"v":0}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":50,"msg":"this is at error level","time":1457531561636,"v":0}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":30,"msg":"the answer is 42","time":1457531561637,"v":0}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1457531561637,"v":0,"obj":42}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1457531561638,"v":0,"obj":42,"b":2}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":30,"msg":"another","time":1457531561638,"v":0,"obj":{"aa":"bbb"}}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":50,"msg":"an error","time":1457531561639,"v":0,"type":"Error","stack":"Error: an error\n    at Object.<anonymous> (/Users/davidclements/z/nearForm/pino/example.js:14:7)\n    at Module._compile (module.js:413:34)\n    at Object.Module._extensions..js (module.js:422:10)\n    at Module.load (module.js:357:32)\n    at Function.Module._load (module.js:314:12)\n    at Function.Module.runMain (module.js:447:10)\n    at startup (node.js:141:18)\n    at node.js:933:3"}
{"pid":13087,"hostname":"MacBook-Pro-3.home","level":30,"msg":"after setImmediate","time":1457531561641,"v":0}

```

<a name="benchmarks"></a>
## Benchmarks

As far as we know, it is the fastest logger in town:

`info('hello world')`:

```
benchBunyan*10000: 1115.193ms
benchWinston*10000: 1722.497ms
benchBole*10000: 1640.052ms
benchPino*10000: 265.622ms
```

`info({'hello': 'world'})`:

```
benchBunyanObj*10000: 1252.539ms
benchWinstonObj*10000: 1729.837ms
benchBoleObj*10000: 1491.677ms
benchPinoObj*10000: 365.207ms
```

`info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})`:

```
benchBunyanInterpolateExtra*10000: 2607.519ms
benchWinstonInterpolateExtra*10000: 2258.154ms
benchBoleInterpolateExtra*10000: 3069.085ms
benchPinoInterpolateExtra*10000: 450.634ms
```

In multiple cases, pino is 6x faster than alternatives.

<a name="cli"></a>
## CLI

To use the command line tool, we can install `pino` globally:

```sh
npm install -g pino
```

Then we simply pipe a log file through `pino`:

```sh
cat log | pino
```

There's also a transformer flag that converts Epoch timestamps to ISO timestamps. 

```sh
cat log | pino -t
```

For instance, `pino -t` will transform this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1457537229339,"v":0}
```

Into this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":"2016-03-09T15:27:09.339Z","v":0}
```

<a name="api"></a>
## API

  * <a href="#constructor"><code><b>pino()</b></code></a>
  * <a href="#child"><code>logger.<b>child()</b></code></a>
  * <a href="#level"><code>logger.<b>level</b></code></a>
  * <a href="#fatal"><code>logger.<b>fatal()</b></code></a>
  * <a href="#error"><code>logger.<b>error()</b></code></a>
  * <a href="#warn"><code>logger.<b>warn()</b></code></a>
  * <a href="#info"><code>logger.<b>info()</b></code></a>
  * <a href="#debug"><code>logger.<b>debug()</b></code></a>
  * <a href="#trace"><code>logger.<b>trace()</b></code></a>
  * <a href="#reqSerializer"><code>pino.stdSerializers.<b>req</b></code></a>
  * <a href="#resSerializer"><code>pino.stdSerializers.<b>res</b></code></a>

<a name="constructor"></a>
### pino([stream], [opts])

Returns a new logger. Allowed options are:

* `safe`: avoid error causes by circular references in the object tree,
  default `true`
* `name`: the name of the logger, default `undefined`
* `serializers`: an object containing functions for custom serialization of objects. These functions should return an JSONifiable object and they should never throw
* `slowtime`: Outputs ISO time stamps (`'2016-03-09T15:18:53.889Z'`) instead of Epoch time stamps (`1457536759176`). **WARNING**: This option carries a 25% performance drop, we recommend using default Epoch timestamps and transforming logs after if required. The `pino -t` command will do this for you (see [CLI](#cli))

`stream` is a Writable stream, defaults to `process.stdout`.

Example:

```js
'use strict'

var pino = require('pino')
var instance = pino({
  name: 'myapp',
  safe: true,
  serializers: {
    req: pino.stdSerializers.req
    res: pino.stdSerializers.res
  }
}
```

<a name="child"></a>
### logger.child(bindings)

Creates a child logger, setting all key-value pairs in `bindings` as
properties in the log lines. All serializers will be applied to the
given pair.

Example:

```js
logger.child({ a: 'property' }).info('hello child!')
// generates
// {"pid":46497,"hostname":"MacBook-Pro-di-Matteo.local","level":30,"msg":"hello child!","time":1458124707120,"v":0,"a":"property"}
```

It leverages the output stream of the parent and
its log level. These settings are immutable and pulled out during the
instantiation of the child logger.

Creating a child logger is fast:

```
benchPinoCreation*10000: 507ms
benchBunyanCreation*10000: 1473ms
benchBoleCreation*10000: 1648ms
benchPinoCreation*10000: 461ms
benchBunyanCreation*10000: 1448ms
benchBoleCreation*10000: 1621ms
```

And logging throuh a child logger has little performance penalty:

```
benchPinoChild*10000: 394ms
benchBoleChild*10000: 1504ms
benchBunyanObj*10000: 1326ms
benchPinoChild*10000: 368ms
benchBoleChild*10000: 1486ms
```

<a name="level"></a>
### logger.level

Set this property to the desired logging level.

In order of priority, available levels are:

  1. <a href="#fatal">`'fatal'`</a>
  2. <a href="#error">`'error'`</a>
  3. <a href="#warn">`'warn'`</a>
  4. <a href="#info">`'info'`</a>
  5. <a href="#debug">`'debug'`</a>
  6. <a href="#trace">`'trace'`</a>

Example: `logger.level = 'info'`

The logging level is a *minimum* level. For instance if `logger.level` is `'info'` then all `fatal`, `error`, `warn`, and `info` logs will be enabled.

<a name="fatal"></a>
### logger.fatal([obj], msg, [...])

Log at `'fatal'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`](https://nodejs.org/api/util.html#util_util_format_format)

<a name="error"></a>
### logger.error([obj], msg, [...])

Log at `'error'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`](https://nodejs.org/api/util.html#util_util_format_format)

<a name="warn"></a>
### logger.warn([obj], msg, [...])

Log at `'warn'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`](https://nodejs.org/api/util.html#util_util_format_format)

<a name="info"></a>
### logger.info([obj], msg, [...])

Log at `'info'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`](https://nodejs.org/api/util.html#util_util_format_format)

<a name="debug"></a>
### logger.debug([obj], msg, [...])

Log at `'debug'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`](https://nodejs.org/api/util.html#util_util_format_format)

<a name="trace"></a>
### logger.trace([obj], msg, [...])

Log at `'trace'` level the given `msg`. If the first argument is an
object, all its properties will be included in the JSON line.
If more args follows `msg`, these will be used to format `msg` using
[`util.format`](https://nodejs.org/api/util.html#util_util_format_format)

<a name="reqSerializer"></a>
### pino.stdSerializers.req

Function to generate a JSONifiable object out of an HTTP request from
node HTTP server.

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

<a name="resSerializer"></a>
### pino.stdSerializers.res

Function to generate a JSONifiable object out of an HTTP
response from
node HTTP server.

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

<a name="rotate"></a>
## How do I rotate log files

You should configure
[logrotate](https://github.com/logrotate/logrotate) to rotate your log
files, and just redirect the standard output of your application to a
file, like so:

```
node server.js > /var/log/myapp.log
```

In order to rotate your log files, add in `/etc/logrotate.d/myapp`:

```
/var/log/myapp.log {
       su root
       daily
       rotate 7
       delaycompress
       compress
       notifempty
       missingok
       copytruncate
}
```

<a name="transports"></a>
## How to use Transports with Pino

Transports are not part of Pino. There will never be an API for transports,
or support for ObjectMode Writable streams.
This library is fast because it does way less than the others. We went
to great lengths to make sure this library is _really fast_, and transports
will slow things down.

So, how do you do a transport? With Pino, we create a separate process for our transport and pipe to it.
It's the Unix philosophy.

Something like:

```js
var split = require('split2')
var pump = require('pump')
var through = require('through2')

var myTransport = through.obj(function (chunk, enc, cb) {
  // do whatever you want here!
  console.log(chunk)
  cb()
}

pump(process.stdin, split2(JSON.parse), myTransport)
```

Using transports in the same process causes unnecessary load and slows down Node's single threaded event loop.

If you write a transport, let us know and we will add a link here!

<a name="changelog"></a>
## Changelog

### v1.0.5

* Restored the binary functionality to pretty-print the logs

### v1.0.4

* README fix: the order of params in the constructor was inverted

### v1.0.3

* [#16](https://github.com/mcollina/pino/pull/16) added changelog

### v1.0.2

* [#15](https://github.com/mcollina/pino/pull/15) improved serializer output around circular references 

### v1.0.1

* [#13](https://github.com/mcollina/pino/pull/13) 6x speed increase on multi arg logs by using custom format/interpolation function instead of util.format

### v1.0.0

* first stable release


<a name="acknowledgements"></a>
## Acknowledgements

This project was kindly sponsored by [nearForm](http://nearform.com).

## License

MIT
