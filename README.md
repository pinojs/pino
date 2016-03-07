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

<a name="constructor"></a>
### pino([opts], [stream])

Returns a new logger. Allowed options are:

* `safe`: avoid error causes by circular references in the object tree,
  default `true`
* `name`: the name of the logger, default `undefined`

`stream` is a Writable stream, defaults to `process.stdout`.

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

<a name="benchmarks"></a>
## Benchmarks

As far as I know, it is the fastest logger in town:

```
benchBunyan*10000: 1128ms
benchWinston*10000: 1903ms
benchBole*10000: 1511ms
benchPino*10000: 439ms
benchBunyanObj*10000: 1209ms
benchWinstonObj*10000: 1948ms
benchPinoObj*10000: 526ms
benchBoleObj*10000: 1466ms
benchBunyan*10000: 1064ms
benchWinston*10000: 1827ms
benchBole*10000: 1524ms
benchPino*10000: 438ms
benchBunyanObj*10000: 1220ms
benchWinstonObj*10000: 2119ms
benchPinoObj*10000: 524ms
benchBoleObj*10000: 1522ms
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
