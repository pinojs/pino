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

The `logger.flush()` method does not work when using `pino-pretty` because:

1. **Transport Architecture**: `pino-pretty` runs in a separate worker thread via the transport mechanism.

2. **Buffer Flow**: When you call `logger.flush()`, it flushes the SonicBoom destination in the main thread, but the logs remain queued in the thread-stream worker waiting to be processed by `pino-pretty`.

3. **No Cross-Thread Flush**: The flush operation never propagates through to the worker thread where the pretty printer is processing the output.

This means that even with `logger.flush()`, your formatted logs may not appear immediately, and the flush will only ensure the main thread buffer is written, not the formatted output.

See also:

* [`pino.destination` API](/docs/api.md#pino-destination)
* [`destination` parameter](/docs/api.md#destination)
