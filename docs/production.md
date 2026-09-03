# Production setup

This guide answers: **what is the recommended way to run Pino in production** when you want least overhead and logs on stdout (or a file)?

## Short answer

For production logging to **stdout** with minimum overhead, use the default logger:

```js
const pino = require('pino')

// Same as: pino(pino.destination(1))
const logger = pino()
```

Or explicitly:

```js
const logger = pino(pino.destination(1)) // 1 = stdout
```

That writes newline-delimited JSON on the main thread via a fast destination stream. It is the usual production setup when a process manager, container runtime, or log agent collects stdout.

## `pino.destination` vs worker transports

| Approach | Where work runs | When to use |
| --- | --- | --- |
| `pino()` / `pino.destination(...)` | Main thread | **Default production choice** for stdout/stderr or a simple file path when you want lowest overhead |
| `pino.transport({ target: 'pino/file', ... })` | Worker thread | When destinations or formatting would block the event loop (multiple files, heavy processing, network shipping from Node) |

From the transports docs: `pino.destination` runs in the main thread; `pino/file` sets up a destination in a worker thread. Worker transports add isolation and flexibility, but they are not automatically "faster" than logging to stdout with the default destination. Shipping and heavy processing should still happen **out of process** when possible (sidecar, log drain, platform log collection).

## Recommended production patterns

### 1. Log JSON to stdout (most common)

```js
const logger = require('pino')({
  level: process.env.LOG_LEVEL || 'info'
})

logger.info('server started')
```

Let Docker, Kubernetes, systemd, or your host collect stdout. Do not pretty-print in production.

### 2. Async file destination (main thread, non-blocking writes)

```js
const pino = require('pino')

const logger = pino(pino.destination({
  dest: '/var/log/myapp.log',
  sync: false
}))
```

### 3. Worker transport when you must process logs in Node

```js
const pino = require('pino')

const logger = pino({
  transport: {
    targets: [
      { target: 'pino/file', options: { destination: 1 } }, // stdout
      { target: 'pino/file', options: { destination: '/var/log/myapp.log' } }
    ]
  }
})
```

Use this when you need multiple Node-side targets. Prefer external log pipelines over many in-process transports.

## Development vs production

| | Development | Production |
| --- | --- | --- |
| Formatting | [`pino-pretty`](https://github.com/pinojs/pino-pretty) | Raw JSON |
| Level | `debug` / `trace` often fine | `info` or higher |
| Destination | stdout with pretty transport | stdout or file via `destination` |

```js
const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined
})
```

## See also

* [Asynchronous logging](asynchronous.md)
* [Transports](transports.md)
* [API: `pino.destination`](api.md#pino-destination)
* [API: `pino.transport`](api.md#pino-transport)
