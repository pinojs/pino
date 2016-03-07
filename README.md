# pino

[Extremely fast](#benchmarks) node.js logger, inspired by Bunyan.
It also includes a shell utility to pretty-print its log files.

![cli](https://raw.githubusercontent.com/mcollina/pino/master/demo.png)

* [Installation](#install)
* [Usage](#usage)
* [API](#api)
* [Benchmarks](#benchmarks)
* [How do I rotate log files?](#rotate)
* [Acknowledgements](#acknowledgements)
* [License](#license)

## Install

```
npm install pino --save
```

## Usage

```js
'use strict'

var pino = require('pino')(
  // or any other stream
  // defaults to stdout
  process.stdout
)
var info = pino.info
var error = pino.error

info('hello world')
info('the answer is %d', 42)
info({ obj: 42 }, 'hello world')
setImmediate(info, 'wrapped')
error(new Error('something bad happened'))
```

This produces:

```
{"pid":12244,"hostname":"MBP-di-Matteo","level":30,"msg":"hello world","time":"2016-03-05T16:00:45.858Z","v":0}
{"pid":12244,"hostname":"MBP-di-Matteo","level":50,"msg":"this is at error level","time":"2016-03-05T16:00:45.860Z","v":0}
{"pid":12244,"hostname":"MBP-di-Matteo","level":30,"msg":"the answer is 42","time":"2016-03-05T16:00:45.861Z","v":0}
{"pid":12244,"hostname":"MBP-di-Matteo","level":30,"msg":"hello world","time":"2016-03-05T16:00:45.861Z","v":0,"obj":42}
{"pid":12244,"hostname":"MBP-di-Matteo","level":30,"msg":"hello world","time":"2016-03-05T16:00:45.862Z","v":0,"obj":42,"b":2}
{"pid":12244,"hostname":"MBP-di-Matteo","level":30,"msg":"another","time":"2016-03-05T16:00:45.862Z","v":0,"obj":{"aa":"bbb"}}
{"pid":12244,"hostname":"MBP-di-Matteo","level":50,"msg":"an error","time":"2016-03-05T16:00:45.863Z","v":0,"type":"Error","stack":"Error: an error\n    at Object.<anonymous> (/Users/matteo/Repositories/pino/example.js:14:7)\n    at Module._compile (module.js:435:26)\n    at Object.Module._extensions..js (module.js:442:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:313:12)\n    at Function.Module.runMain (module.js:467:10)\n    at startup (node.js:136:18)\n    at node.js:963:3"}
{"pid":12244,"hostname":"MBP-di-Matteo","level":30,"msg":"after setImmediate","time":"2016-03-05T16:00:45.865Z","v":0}
```

<a name="api"></a>
## API

  * <a href="#constructor"><code><b>pino()</b></code></a>
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
### pino([opts], [stream])

Returns a new logger. Allowed options are:

* `safe`: avoid error causes by circular references in the object tree,
  default `true`
* `name`: the name of the logger, default `undefined`
* `serializers`: an object containing functions for custom serialization
  of objects. These functions should return an jsonificable object and
  they should never throw.

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

<a name="level"></a>
### logger.level

Property to read and write the current level of the logger.
In order of priotity, avaliable levels are:

  1. <a href="#fatal">`'fatal'`</a>
  2. <a href="#error">`'error'`</a>
  3. <a href="#warn">`'warn'`</a>
  4. <a href="#info">`'info'`</a>
  5. <a href="#debug">`'debug'`</a>
  6. <a href="#trace">`'trace'`</a>

By setting a given level (e.g. `logger.level = 'info'`) you enable all
the levels including and above the passed one (in the example, info,
warn, error and fatal). The default is `info`.

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

Function to generate a jsonificable object out of an HTTP request from
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

Function to generate a jsonificable object out of an HTTP
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

<a name="benchmarks"></a>
## Benchmarks

As far as I know, it is the fastest logger in town:

```
benchBunyan*10000: 1116.721ms
benchWinston*10000: 1783.362ms
benchBole*10000: 1496.580ms
benchPino*10000: 363.430ms
benchBunyanObj*10000: 1228.538ms
benchWinstonObj*10000: 1895.251ms
benchPinoObj*10000: 427.989ms
benchBoleObj*10000: 1487.543ms
benchBunyan*10000: 1088.231ms
benchWinston*10000: 1733.589ms
benchBole*10000: 1514.004ms
benchPino*10000: 377.418ms
benchBunyanObj*10000: 1205.833ms
benchWinstonObj*10000: 1800.594ms
benchPinoObj*10000: 412.170ms
benchBoleObj*10000: 1522.469ms
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

<a name="acknowledgements"></a>
## Acknowledgements

This project was kindly sponsored by [nearForm](http://nearform.com).

## License

MIT
