# Extreme Mode

In essence, extreme mode enables even faster performance by Pino.

In Pino's standard mode of operation log messages are directly written to the
output stream as the messages are generated. Extereme mode works by buffering
log messages and writing them in larger chunks.

This has a couple of important caveats:

* 4KB of spare RAM will be needed for logging
* As opposed to the default mode, there is not a one-to-one relationship between
  calls to logging methods (e.g. `logger.info`) and writes to a log file
* There is a possibility of the most recently buffered log messages being lost
  (up to 4KB of logs)
  * For instance, a power cut will mean up to 4KB of buffered logs will be lost
* Pino will register handlers for the following process events/signals so that
  Pino can flush the extreme mode buffer:

  + `beforeExit`
  + `exit`
  + `uncaughtException`
  + `SIGHUP`
  + `SIGINT`
  + `SIGQUIT`
  + `SIGTERM`

  In all of these cases, except `SIGHUP`, the process is in a state that it
  *must* terminate. Thus, if an `onTerminated` function isn't registered when
  constructing a Pino instance (see [pino#constructor](api.md#constructor)),
  then Pino will invoke `process.exit(0)` when no error has occurred, or
  `process.exit(1)` otherwise. If an `onTerminated` function is supplied, it 
  is the responsibility of the `onTerminated` function to manually exit the process.

  In the case of `SIGHUP`, we will look to see if any other handlers are
  registered for the event. If not, we will proceed as we do with all other
  signals. If there are more handlers registered than just our own, we will
  simply flush the extreme mode buffer.

So in summary, only use extreme mode when performing an extreme amount of
logging and it is acceptable to potentially lose the most recent logs.

## Usage

Extreme mode is defined by creating an extreme mode destination with
`pino.extreme()`.

The following creates an extreme destination to stdout:

```js
'use strict'

const pino = require('pino')
const dest = pino.extreme() // no arguments
const logger = pino(dest)

setInterval(function () {
  // flush is asynchronous
  dest.flush()
}, 10000).unref()
```

An extreme destination is an instance of
[`SonicBoom`](https://github.com/mcollina/sonic-boom) with `4096`
buffering.

In case a synchronous flush is needed, `dest.flushSync()` can be called.
This method might cause some data loss if a write was already in
progress, so use it only if truly needed.

* See [`pino.extreme` api](/docs/api.md#pino-extreme)
* See [`destination` parameter](/docs/api.md#destination)
