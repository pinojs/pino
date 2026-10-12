# Migrating from Bunyan

This guide helps developers migrate from [bunyan](https://github.com/trentm/node-bunyan) to pino. While both libraries produce JSON logs, there are some key differences in API and architecture.

## Quick Comparison

| Feature | Bunyan | Pino |
|---------|--------|------|
| Logger creation | `bunyan.createLogger()` | `pino()` |
| Log output | Built-in streams | Transports (separate process) |
| Pretty printing | `bunyan` CLI | `pino-pretty` transport |
| Performance | Good | [Significantly faster](benchmarks.md) |
| Child loggers | `log.child()` | `log.child()` |
| Serializers | Built-in | Custom serializers |

## Basic Setup

### Bunyan

```js
const bunyan = require('bunyan')
const log = bunyan.createLogger({ name: 'myapp' })
log.info('hello world')
```

### Pino

```js
const pino = require('pino')
const log = pino({ name: 'myapp' })
log.info('hello world')
```

## Log Levels

Both libraries use the same standard log levels. The mapping is direct:

| Level | Bunyan | Pino |
|-------|--------|------|
| trace | 10 | 10 |
| debug | 20 | 20 |
| info | 30 | 30 |
| warn | 40 | 40 |
| error | 50 | 50 |
| fatal | 60 | 60 |

## Logging with Objects

Both libraries support logging objects alongside messages:

### Bunyan

```js
log.info({ user: 'alice' }, 'user logged in')
```

### Pino

```js
log.info({ user: 'alice' }, 'user logged in')
```

## Child Loggers

The child logger API is similar in both libraries:

### Bunyan

```js
const child = log.child({ requestId: '1234' })
child.info('processing request')
```

### Pino

```js
const child = log.child({ requestId: '1234' })
child.info('processing request')
```

## Streams and Transports

This is where bunyan and pino differ significantly.

### Bunyan Streams

Bunyan processes logs synchronously in the main thread:

```js
const bunyan = require('bunyan')
const log = bunyan.createLogger({
  name: 'myapp',
  streams: [
    { level: 'info', stream: process.stdout },
    { level: 'error', path: '/var/log/myapp-error.log' }
  ]
})
```

### Pino Transports

Pino recommends processing logs in a separate thread/process for better performance:

```js
const pino = require('pino')
const transport = pino.transport({
  targets: [
    { target: 'pino/file', options: { destination: 1 } }, // stdout
    { target: 'pino/file', options: { destination: '/var/log/myapp-error.log' }, level: 'error' }
  ]
})
const log = pino(transport)
```

For simple cases, you can still write directly to stdout:

```js
const pino = require('pino')
const log = pino()
```

See the [transports documentation](transports.md) for more details.

## Pretty Printing

### Bunyan

Bunyan uses a CLI tool for pretty printing:

```bash
node app.js | bunyan
```

### Pino

Pino uses the `pino-pretty` module:

```bash
node app.js | pino-pretty
```

Or as a transport (not recommended for production):

```js
const pino = require('pino')
const log = pino({
  transport: {
    target: 'pino-pretty'
  }
})
```

See the [pretty printing documentation](pretty.md) for more options.

## Serializers

Both libraries support custom serializers, but the configuration differs slightly.

### Bunyan

```js
const bunyan = require('bunyan')
const log = bunyan.createLogger({
  name: 'myapp',
  serializers: {
    req: bunyan.stdSerializers.req,
    err: bunyan.stdSerializers.err
  }
})
```

### Pino

```js
const pino = require('pino')
const log = pino({
  serializers: {
    req: pino.stdSerializers.req,
    err: pino.stdSerializers.err
  }
})
```

Pino's standard serializers are available via `pino.stdSerializers`.

## Request Logging

For web frameworks, use the dedicated pino middleware:

- **Express**: Use [pino-http](https://github.com/pinojs/pino-http) or [express-pino-logger](https://github.com/pinojs/express-pino-logger)
- **Fastify**: Use built-in pino integration
- **Koa**: Use [koa-pino-logger](https://github.com/pinojs/koa-pino-logger)

See the [web frameworks documentation](web.md) for more details.

## Output Differences

Bunyan and pino produce slightly different JSON output:

### Bunyan Output

```json
{"name":"myapp","hostname":"host","pid":1234,"level":30,"msg":"hello","time":"2024-01-01T00:00:00.000Z","v":0}
```

### Pino Output

```json
{"level":30,"time":1704067200000,"pid":1234,"hostname":"host","msg":"hello"}
```

Key differences:
- Pino uses milliseconds since epoch for `time` by default (configurable)
- Bunyan includes `v` (record version) and `name` by default
- Field ordering may differ

## Further Reading

- [Pino API Documentation](api.md)
- [Transports](transports.md)
- [Benchmarks](benchmarks.md)
- [Ecosystem](ecosystem.md)
