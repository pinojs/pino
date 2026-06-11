# Child loggers

Let's assume we want to have `"module":"foo"` added to every log within a
module `foo.js`.

To accomplish this, simply use a child logger:

```js
'use strict'
// imports a pino logger instance of `require('pino')()`
const parentLogger = require('./lib/logger')
const log = parentLogger.child({module: 'foo'})

function doSomething () {
  log.info('doSomething invoked')
}

module.exports = {
  doSomething
}
```

Child logger bindings are top-level fields on every log line emitted by the
child logger. Do not create child loggers from externally supplied objects or
user-controlled binding names, because those keys can conflict with Pino fields
such as `level`, `time`, or `msg`, as well as application or security fields.
If untrusted data must be associated with logs, place it under an
application-controlled key:

```js
// Avoid: user-controlled keys become top-level fields on every child log line
const child = logger.child(untrustedObject)

// Prefer: user-controlled keys are contained under a trusted namespace
const child = logger.child({ untrusted: untrustedObject })
```

As a matter of good security hygiene, prefer not to log untrusted data at all
unless it is necessary. When it is necessary, sanitize and redact it first.
See also [`logger.child()` in the API documentation](/docs/api.md#child) and
[`mergingObject`](/docs/api.md#mergingobject).

## Cost of child logging

Child logger creation is fast:

```
benchBunyanCreation*10000: 564.514ms
benchBoleCreation*10000: 283.276ms
benchPinoCreation*10000: 258.745ms
benchPinoExtremeCreation*10000: 150.506ms
```

Logging through a child logger has little performance penalty:

```
benchBunyanChild*10000: 556.275ms
benchBoleChild*10000: 288.124ms
benchPinoChild*10000: 231.695ms
benchPinoExtremeChild*10000: 122.117ms
```

Logging via the child logger of a child logger also has negligible overhead:

```
benchBunyanChildChild*10000: 559.082ms
benchPinoChildChild*10000: 229.264ms
benchPinoExtremeChildChild*10000: 127.753ms
```

## Duplicate keys caveat

Naming conflicts can arise between child loggers and
children of child loggers.

This isn't as bad as it sounds, even if the same keys between
parent and child loggers are used, Pino resolves the conflict in the sanest way.

For example, consider the following:

```js
const pino = require('pino')
pino(pino.destination('./my-log'))
  .child({a: 'property'})
  .child({a: 'prop'})
  .info('howdy')
```

```sh
$ cat my-log
{"pid":95469,"hostname":"MacBook-Pro-3.home","level":30,"msg":"howdy","time":1459534114473,"a":"property","a":"prop"}
```

Notice how there are two keys named `a` in the JSON output. The sub-child's properties
appear after the parent child properties.

At some point, the logs will most likely be processed (for instance with a [transport](transports.md)),
and this generally involves parsing. `JSON.parse` will return an object where the conflicting
namespace holds the final value assigned to it:

```sh
$ cat my-log | node -e "process.stdin.once('data', (line) => console.log(JSON.stringify(JSON.parse(line))))"
{"pid":95469,"hostname":"MacBook-Pro-3.home","level":30,"msg":"howdy","time":"2016-04-01T18:08:34.473Z","a":"prop"}
```

Ultimately the conflict is resolved by taking the last value, which aligns with Bunyan's child logging
behavior.

There may be cases where this edge case becomes problematic if a JSON parser with alternative behavior
is used to process the logs. It's recommended to be conscious of namespace conflicts with child loggers,
in light of an expected log processing approach. This is especially important for untrusted data: do not
allow externally supplied objects or user-controlled key names to become child logger bindings.

One of Pino's performance tricks is to avoid building objects and stringifying
them, so we're building strings instead. This is why duplicate keys between
parents and children will end up in the log output.
