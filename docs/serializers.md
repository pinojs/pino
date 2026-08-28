# Serializers

Serializers rewrite the values of top-level properties before they are written to the log. A serializer is registered against a key name and receives the value found at that key.

## The serializer interface

A serializer is a function that takes one argument, the value at the key, and returns the replacement value. It must be synchronous, and it must return something the stringifier can handle:

```js
const logger = require('pino')({
  serializers: {
    user (value) {
      return { id: value.id }
    }
  }
})

logger.info({ user: { id: 1, name: 'Ada' } })
// {"level":30,...,"user":{"id":1}}
```

## Which properties are serialized

Serializers apply to the object passed to a log method, and only to its own top-level keys. Nested properties are untouched unless the serializer registered for their parent handles them.

A key whose value is `undefined` is skipped, and its serializer does not run.

## Errors

Errors receive a fallback. When a key matches the configured `errorKey` (`err` by default) and no serializer is registered for that exact key, the `err` serializer runs instead:

```js
const logger = require('pino')({
  serializers: {
    err (error) {
      return { type: error.constructor.name, message: error.message }
    }
  }
})
```

## Serializing the message

Registering a serializer under the configured `messageKey` (`msg` by default) rewrites the log message:

```js
const logger = require('pino')({
  serializers: {
    msg (message) {
      return message.toUpperCase()
    }
  }
})
```

## Standard serializers

Pino ships the serializers from [pino-std-serializers](https://github.com/pinojs/pino-std-serializers) as `pino.stdSerializers`, covering errors, and HTTP requests and responses. See [`pino.stdSerializers`](/docs/api.md#pino-stdserializers).

## Child loggers

A child logger inherits its parent's serializers. Passing `serializers` to `child()` merges them over the inherited set, so a child can add new serializers or replace an inherited one, and the parent is unaffected.

See [Child loggers](/docs/child-loggers.md).

## Serializing the whole object

`serializers[Symbol.for('pino.*')]` is deprecated. Use `formatters.log` to transform the entire log object instead. See [`formatters`](/docs/api.md#opt-formatters).
