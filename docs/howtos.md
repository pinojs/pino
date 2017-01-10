# Table of Contents

+ [How to use Pino with Express](#express)
+ [How to use Pino with Hapi](#hapi)
+ [How to use Pino with Restify](#restify)
+ [How to use Pino with Koa](#koa)
+ [How to use Pino with debug](#debug)
+ [How to rotate log files](#rotate)
+ [How to save to multiple file](#multiple)
+ [How to redact sensitive information](#redact)

<a id="express"></a>
## How to use Pino with Express

```sh
npm install --save express-pino-logger
```

```js
var app = require('express')()
var pino = require('express-pino-logger')()

app.use(pino)

app.get('/', function (req, res) {
  req.log.info('something')
  res.send('hello world')
})

app.listen(3000)
```

See the [express-pino-logger readme](http://npm.im/express-pino-logger) for more info.

<a id="hapi"></a>
## How to use Pino with Hapi

```sh
npm install --save hapi-pino
```

```js
'use strict'

const Hapi = require('hapi')

const server = new Hapi.Server()
server.connection({ port: 3000 })

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    request.logger.info('In handler %s', request.path)
    return reply('hello world')
  }
})

server.register(require('hapi-pino'), (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  server.logger().info('another way for accessing it')

  // Start the server
  server.start((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })
})
```

See the [hapi-pino readme](http://npm.im/hapi-pino) for more info.

<a id="restify"></a>
## How to use Pino with Restify

```sh
npm install --save restify-pino-logger
```

```js
var server = require('restify').createServer({name: 'server'})
var pino = require('restify-pino-logger')()

server.use(pino)

server.get('/', function (req, res) {
  req.log.info('something')
  res.send('hello world')
})

server.listen(3000)
```

See the [restify-pino-logger readme](http://npm.im/restify-pino-logger) for more info.

<a id="koa"></a>
## How to use Pino with koa

### Koa v1

```sh
npm install --save koa-pino-logger@1
```

```js
var app = require('koa')()
var pino = require('koa-pino-logger')()

app.use(pino)

app.use(function * () {
  this.log.info('something else')
  this.body = 'hello world'
})

app.listen(3000)
```

See the [koa-pino-logger v1 readme](https://github.com/pinojs/koa-pino-logger/tree/v1) for more info.

### Koa v2

```sh
npm install --save koa-pino-logger@2
```

```js
var Koa = require('koa')
var app = new Koa()
var pino = require('koa-pino-logger')()

app.use(pino)

app.use((ctx) => {
  ctx.log.info('something else')
  ctx.body = 'hello world'
})

app.listen(3000)
```

See the [koa-pino-logger v2 readme](https://github.com/pinojs/koa-pino-logger/tree/v2) for more info.

<a id="debug"></a>
## How to use Pino with debug
Capture debug logs in JSON format, at 10x-20x the speed:
The popular [`debug`](http://npm.im/debug) which
used in many modules accross the ecosystem.

The [`pino-debug`](http://github.com/pinojs/pino-debug)
can captures calls to the `debug` loggers and run them
through `pino` instead. This results in a 10x (20x in extreme mode)
performance improvement, while logging out more information, in the
usual JSON format.

The quick start way to enable this is simply to install [`pino-debug`](http://github.com/pinojs/pino-debug)
and preload it with the `-r` flag, enabling any `debug` logs with the
`DEBUG` environment variable:

```sh
$ npm i --save pino-debug
$ DEBUG=* node -r pino-debug app.js
```

[`pino-debug`](http://github.com/pinojs/pino-debug) also offers fine grain control to map specific `debug`
namespaces to `pino` log levels. See [`pino-debug`](http://github.com/pinojs/pino-debug)
for more.

<a id="rotate"></a>
## How do I rotate log files?

Use a separate tool for log rotation:
We recommend [logrotate](https://github.com/logrotate/logrotate).
Consider we output our logs to `/var/log/myapp.log` like so:

```
> node server.js > /var/log/myapp.log
```

We would rotate our log files with logrotate, by adding the following to `/etc/logrotate.d/myapp`:

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

<a id="multiple"></a>
## How to save to multiple files?

Let's assume you want to store all error messages to a separate log file:

Install [pino-tee](http://npm.im/pino-tee) with:

```bash
npm i pino-tee -g
```

The following writes the log output of `app.js` to `./all-logs`, while
writing only warnings and errors to `./warn-log:

```bash
node app.js | pino-tee warn ./warn-logs > ./all-logs
```

<a id="redact"></a>
## How do I redact sensitive information??

Use [pino-noir](http://npm.im/pino-noir) for performant log redaction:

Install and require [pino-noir](http://npm.im/pino-noir),
initialize with the key paths you wish to redact and pass the
resulting instance in through the `serializers` option

```js
var noir = require('pino-noir')
var pino = require('pino')({
  serializers: noir(['key', 'path.to.key'])
})

pino.info({
  key: 'will be redacted',
  path: {
    to: {key: 'sensitive', another: 'thing'}
  },
  more: 'stuff'
})

// {"pid":7306,"hostname":"x","level":30,"time":1475519922198,"key":"[Redacted]","path":{"to":{"key":"[Redacted]","another":"thing"}},"more":"stuff","v":1}
```

If you have other serializers simply extend:

```js
var noir = require('pino-noir')
var pino = require('pino')({
  serializers: Object.assign(
    noir(['key', 'path.to.key']),
    {myCustomSerializer: () => {}}
})
```