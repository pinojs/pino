# Frequently Asked Questions

+ [How do I rotate log files?](#rotate)
+ [How do I save to multiple files?](#multiple)
+ [How do I filter logs?](#filter-logs)
+ [How do I automatically add something to every log?](#auto-add)
+ [How do I stop `name` from being overwritten?](#dupe-props)
+ [How do I use a transport with systemd?](#transport-systemd)
+ [How do I make the level show as the name instead of the value?](#level-string)
+ [How do I use Pino with debug?](#debug)
+ [How do I use Pino with Express?](#express)
+ [How do I use Pino with Hapi?](#hapi)
+ [How do I use Pino with Restify?](#restify)
+ [How do I use Pino with Koa?](#koa)

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
## How do I save to multiple files?

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

<a id="filter-logs"></a>
## How do I filter logs?
The Pino authors are firm believers in using common, pre-existing, system
utilities. Thus, some recommendations for this are:

1. Use [`grep`](https://linux.die.net/man/1/grep):
    ```sh
    $ # View all "INFO" level logs
    $ node your_app.js | grep '"level":30'
    ```
1. Use [`jq`](https://stedolan.github.io/jq/):
    ```sh
    $ # View all "ERROR" level logs
    $ node node_app.js | jq 'select(.level == 50)'
    ```

<a id="auto-add"></a>
Let's assume you want to have `"module":"foo"` added to every log within a
module `foo.js`. To accomplish this, simply use a child logger:

```js
'use strict'
// exports an instance of `require('pino')()`
const log = require('./logger').child({module: 'foo'})

function doSomething () {
  log.info('doSomething invoked')
}

module.exports = {
  doSomething
}
```

<a id="transport-systemd"></a>
## How do I use a transport with systemd?
`systemd` makes it complicated to use pipes in services. One method for overcoming
this challenge is to use a subshell:

```
ExecStart=/bin/sh -c '/path/to/node your_app.js | pino-transport'
```

<a id="dupe-props"></a>
## How do I stop `name` from being overwritten?
See the documentation on [duplicate keys](https://github.com/pinojs/pino#duplicate-keys).

<a id="level-string"></a>
## How do I make the level show as the name instead of the string?
Pino log lines are meant to be parseable. Thus, there isn't any built-in option
to change the level from the integer value to the string name. However, there
are a couple of options:

1. If the only change desired is the name, i.e. you want to retain the newline
delimited JSON, then you can use a transport to make the change. One such
transport is [`pino-text-level-transport`](https://npm.im/pino-text-level-transport).
1. Use a prettifier like [`pino-pretty`](https://npm.im/pino-pretty) to make
the logs human friendly.

<a id="debug"></a>
## How do I use Pino with debug?
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


<a id="express"></a>
## How do I use Pino with Express?

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
## How do I use Pino with Hapi?

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
## How do I use Pino with Restify?

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
## How do I use Pino with koa?

### Koa

```sh
npm install --save koa-pino-logger
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

See the [koa-pino-logger readme](https://github.com/pinojs/koa-pino-logger) for more info.