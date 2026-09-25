# Asynchronous Logging

Asynchronous logging enables the minimum overhead of Pino.
Asynchronous logging works by buffering log messages and writing them in larger chunks.

```js
const pino = require('pino')
const logger = pino(pino.destination({
  dest: './my-file', // omit for stdout
  minLength: 4096, // Buffer before writing
  sync: false // Asynchronous logging
}))
```

It's always possible to turn on synchronous logging by passing `sync: true`. 
In this mode of operation, log messages are directly written to the
output stream as the messages are generated with a _blocking_ operation.

* See [`pino.destination`](/docs/api.md#pino-destination)
* `pino.destination` is implemented on [`sonic-boom` ⇗](https://github.com/mcollina/sonic-boom).

### AWS Lambda

Asynchronous logging in AWS Lambda functions will tend to cause delayed
or lost log messages, as logs may not be written to the destination
before the runtime is frozen.

For Lambda deployments, it's recommended to always use a destination
with `sync: true`.

## Caveats

Asynchronous logging has a couple of important caveats:

* As opposed to the synchronous mode, there is not a one-to-one relationship between
  calls to logging methods (e.g. `logger.info`) and writes to a log file
* There is a possibility of the most recently buffered log messages being lost
  in case of a system failure, e.g. a power cut.

### Flush Limitations with `pino-pretty`

`logger.flush()` does not flush the output of `pino-pretty` because:

1. **Transport Architecture**: `pino-pretty` runs in a separate worker thread via the transport mechanism.

2. **Cross-Thread Flush**: `logger.flush(cb)` does reach the worker. Since [thread-stream#198](https://github.com/pinojs/thread-stream/pull/198) the worker waits for the shared buffer to be drained, then looks for a flush primitive on the destination the transport returned: `flush`, `flushSync`, or a pending `drain`.

3. **No Flush Primitive**: The stream `pino-pretty` returns exposes none of those. Its buffered `SonicBoom` is reachable only through the internal `pump`, so the worker has nothing to call and acknowledges the flush right away.

This means that even with `logger.flush()`, your formatted logs may not appear immediately. The flush only guarantees that the main thread buffer was written and that the worker drained the shared buffer, not that `pino-pretty` has written its formatted output.

See also:

* [`pino.destination` API](/docs/api.md#pino-destination)
* [`destination` parameter](/docs/api.md#destination)
