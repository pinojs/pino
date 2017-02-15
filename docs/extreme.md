# Extreme Mode

In essence, extreme mode enables even faster performance by Pino.

In Pino's standard mode of operation log messages are directly written to the
output stream as the messages are generated. Extereme mode works by buffering
log messages and writing them in larger chunks.

This has a couple of important caveats:

* 4KB of spare RAM will be needed for logging
* As opposed to the default mode, there is not a one-to-one relationship between
  calls to logging methods (e.g. `logger.info`) and writes to a log file (or log stream)
* There is a possibility of the most recently buffered log messages being lost
  (up to 4KB of logs)
  * For instance, a power cut will mean up to 4KB of buffered logs will be lost
  * A sigkill (or other untrappable signal) will probably result in the same
  * If writing to a stream other than `process.stdout` or `process.stderr`,
    there is a slight possibility of lost logs or even partially written logs if
    the OS buffers don't have enough space, or something else is being written
    to the stream (or maybe some other reason we've not thought of)
* If you supply an alternate stream to the constructor, then that stream must
  support synchronous writes so that it can be properly flushed on exit. This
  means the stream must expose its file descriptor via `stream.fd` or
  `stream._handle.fd`. Usually they have to be native (from core) stream,
  meaning a TCP/unix socket, a file, or stdout/sderr. If your stream is invalid
  an `error` event will be emitted on the returned logger, e.g.:

  ```js
  var stream = require('stream')
  var pino = require('pino')
  var logger = pino({extreme: true}, new stream.Writable({write: function (chunk) {
    // do something with chunk
  }}))
  logger.on('error', function (err) {
    console.error('pino logger cannot flush on exit due to provided output stream')
    process.exit(1)
  })
  ```
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
  *must* terminate. Thus, if you do not register an `onTerminated` function when
  constructing your Pino instance (see [pino#constructor](API.md#constructor)),
  then Pino will invoke `process.exit(0)` when no error has occurred, or
  `process.exit(1)` otherwise. If you do supply an `onTerminated` function, it
  is left up to you to fully terminate the process.

  In the case of `SIGHUP`, we will look to see if any other handlers are
  registered for the event. If not, we will proceed as we do with all other
  signals. If there are more handlers registered than just our own, we will
  simply flush the extreme mode buffer.

So in summary, only use extreme mode if you're doing an extreme amount of
logging, and you're happy in some scenarios to lose the most recent logs.