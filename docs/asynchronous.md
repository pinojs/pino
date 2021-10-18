# Asynchronous Logging

In essence, asynchronous logging enables even faster performance by Pino.

In Pino's standard mode of operation log messages are directly written to the
output stream as the messages are generated with a _blocking_ operation.
Asynchronous logging works by buffering
log messages and writing them in larger chunks.

```js
const pino = require('pino')
const logger = pino(pino.destination({
  dest: './my-file', // omit for stdout
  minLength: 4096, // Buffer before writing
  sync: false // Asynchronous logging
}))
```

* See [`pino.destination`](/docs/api.md#pino-destination)
* `pino.destination` is implemented on [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom).

### AWS Lambda

On AWS Lambda we recommend to call `dest.flushSync()` at the end
of each function execution to avoid losing data.

## Usage

The `pino.destination({ sync: false })` method will provide an asynchronous destination.

```js
const pino = require('pino')
const dest = pino.destination({ sync: false }) // logs to stdout with no args
const logger = pino(dest)
```

<a id='log-loss-prevention'></a>
## Prevent log loss in Node v12

In Node.js v14+, streams created by `pino.destination()` are automatically 
flushed whenever the process exits.
In Node v12, `pino.final()` can be used to prevent log loss. Here is an example:

```js
const pino = require('pino')
const dest = pino.destination({ sync: false })
const logger = pino(dest)

// asynchronously flush every 10 seconds to keep the buffer empty
// in periods of low activity
setInterval(function () {
  logger.flush()
}, 10000).unref()

// use pino.final to create a special logger that
// guarantees final tick writes
const handler = pino.final(logger, (err, finalLogger, evt) => {
  finalLogger.info(`${evt} caught`)
  if (err) finalLogger.error(err, 'error caused exit')
  process.exit(err ? 1 : 0)
})
// catch all the ways node might exit
process.on('beforeExit', () => handler(null, 'beforeExit'))
process.on('exit', () => handler(null, 'exit'))
process.on('uncaughtException', (err) => handler(err, 'uncaughtException'))
process.on('SIGINT', () => handler(null, 'SIGINT'))
process.on('SIGQUIT', () => handler(null, 'SIGQUIT'))
process.on('SIGTERM', () => handler(null, 'SIGTERM'))
```

The above code will register handlers for the following process events/signals so that
pino can flush the asynchronous logger buffer:

+ `beforeExit`
+ `exit`
+ `uncaughtException`
+ `SIGINT`
+ `SIGQUIT`
+ `SIGTERM`

In all of these cases, except `SIGHUP`, the process is in a state that it
*must* terminate. Note that the handler has a `process.exit(1)` at the end.


* See also [`pino.final` api](/docs/api.md#pino-final)

## Caveats

Asynchronous logging has a couple of important caveats:

* As opposed to the default mode, there is not a one-to-one relationship between
  calls to logging methods (e.g. `logger.info`) and writes to a log file
* There is a possibility of the most recently buffered log messages being lost
  in case of a system failure, e.g. a power cut.
* In Node v14+, Pino will register handlers for the `exit` and `beforeExit` handler so that
  the stream is flushed automatically. This is implemented with the usage of
  [`on-exit-leak-free`](https://github.com/mcollina/on-exit-leak-free).

See also:

* [`pino.destination` api](/docs/api.md#pino-destination)
* [`destination` parameter](/docs/api.md#destination)
