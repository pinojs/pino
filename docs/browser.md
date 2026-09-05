# Browser API

Pino is compatible with [`browserify`](https://npm.im/browserify) for browser-side usage:

This can be useful with isomorphic/universal JavaScript code.

By default, in the browser,
`pino` uses corresponding [Log4j](https://en.wikipedia.org/wiki/Log4j) `console` methods (`console.error`, `console.warn`, `console.info`, `console.debug`, `console.trace`) and uses `console.error` for any `fatal` level logs.

<a id="nodejs-only-apis"></a>
## Node.js-only APIs

The browser build (`browser.js`, selected through the `browser` field in
`package.json`) does not implement the parts of the API that depend on the file
system or on worker threads. Accessing them in the browser throws a
`TypeError`, because the export is simply absent:

```js
const pino = require('pino')
pino.destination('./my-file') // TypeError: pino.destination is not a function
```

The following statics are available in Node.js only:

| Static | Why it is Node.js only |
| --- | --- |
| [`pino.destination()`](/docs/api.md#pino-destination) | Returns a [`SonicBoom`](https://github.com/pinojs/sonic-boom) instance writing to a file descriptor. |
| [`pino.transport()`](/docs/api.md#pino-transport) | Runs a [transport](/docs/transports.md) on a worker thread. |
| [`pino.multistream()`](/docs/api.md#pino-multistream) | Fans out to multiple destination streams. |

`pino.levels`, `pino.stdSerializers` and `pino.stdTimeFunctions` are available in
both environments.

### Methods that are no-ops in the browser

These exist on a browser logger, so calling them is safe, but they do nothing:

* [`logger.flush([cb])`](/docs/api.md#flush) — there is no write buffer
  to flush. Note that a callback passed to it is **not** invoked.
* Every `EventEmitter` method (`on`, `once`, `emit`, `removeListener`,
  `listeners`, ...). As a consequence the
  [`level-change`](/docs/api.md#level-change) event never fires in the
  browser.

### Writing isomorphic code

Code shared between a server and a browser bundle should not call the Node.js
only statics unconditionally. Guard the call rather than the environment, so the
same branch works under any bundler:

```js
const pino = require('pino')

const logger = pino.destination
  ? pino(pino.destination('./my-file')) // Node.js
  : pino({ browser: { asObject: true } }) // browser
```

Note that the browser build's `pino()` accepts the options object only. A second
`destination` argument is accepted but ignored, so a logger constructed with one
still writes to the console rather than failing:

```js
// in the browser the second argument is ignored, not honoured
const logger = pino({ level: 'info' }, someDestination)
logger.info('still goes to the console')
```

Assigning a no-op shim onto the `pino` export (`pino.destination = () => {}`)
works too, but it mutates a module object shared with every other importer in the
bundle; guarding the call site keeps the change local.

## Options

Pino can be passed a `browser` object in the options object,
which can have the following properties:

### `asObject` (Boolean)

```js
const pino = require('pino')({browser: {asObject: true}})
```

The `asObject` option will create a pino-like log object instead of
passing all arguments to a console method, for instance:

```js
pino.info('hi') // creates and logs {msg: 'hi', level: 30, time: <ts>}
```

When `write` is set, `asObject` will always be `true`.

### `asObjectBindingsOnly` (Boolean)

```js
const pino = require('pino')({browser: {asObjectBindingsOnly: true}})
```

The `asObjectBindingsOnly` option is similar to `asObject` but will keep the message
and arguments unformatted. This allows to defer formatting the message to the
actual call to `console` methods, where browsers then have richer formatting in
their devtools than when pino will format the message to a string first.

```js
pino.info('hello %s', 'world') // creates and logs {level: 30, time: <ts>}, 'hello %s', 'world'
```

### `formatters` (Object)

An object containing functions for formatting the shape of the log lines. When provided, it enables the logger to produce a pino-like log object with customized formatting. Currently, it supports formatting for the `level` object only.

##### `level`

Changes the shape of the log level. The default shape is `{ level: number }`.
The function takes two arguments, the label of the level (e.g. `'info'`)
and the numeric value (e.g. `30`).

```js
const formatters = {
  level (label, number) {
    return { level: number }
  }
}
```


### `reportCaller` (Boolean)

Attempts to capture and include the originating callsite (file:line:column) for each log call in the browser logger.

- When used together with `asObject` (or when `formatters` are provided), the callsite is added as a `caller` string property on the emitted log object.
- In the default mode (non‑object), the callsite string is appended as the last argument passed to the corresponding `console` method. This makes the location visible in the console output even though the console’s clickable header still points to Pino internals.

```js
// Object mode: adds `caller` to the log object
const pino = require('pino')({
  browser: {
    asObject: true,
    reportCaller: true
  }
})

pino.info('hello')
// -> { level: 30, msg: 'hello', time: <ts>, caller: '/path/to/file.js:10:15' }

// Default mode: appends the caller string as the last console argument
const pino2 = require('pino')({
  browser: {
    reportCaller: true
  }
})

pino2.info('hello')
// -> console receives: 'hello', '/path/to/file.js:10:15'
```

Notes:

- This is a best‑effort feature that parses the JavaScript Error stack. Stack formats vary across engines.
- The clickable link shown by devtools for a console message is determined by where `console.*` is invoked and cannot be changed by libraries; `reportCaller` surfaces the user callsite alongside the log message.


### `write` (Function | Object)

Instead of passing log messages to `console.log` they can be passed to
a supplied function.

If `write` is set to a single function, all logging objects are passed
to this function.

```js
const pino = require('pino')({
  browser: {
    write: (o) => {
      // do something with o
    }
  }
})
```

If `write` is an object, it can have methods that correspond to the
levels. When a message is logged at a given level, the corresponding
method is called. If a method isn't present, the logging falls back
to using the `console`.


```js
const pino = require('pino')({
  browser: {
    write: {
      info: function (o) {
        //process info log object
      },
      error: function (o) {
        //process error log object
      }
    }
  }
})
```

### `serialize`: (Boolean | Array)

The serializers provided to `pino` are ignored by default in the browser, including
the standard serializers provided with Pino. Since the default destination for log
messages is the console, values such as `Error` objects are enhanced for inspection,
which they otherwise wouldn't be if the Error serializer was enabled.

We can turn all serializers on,

```js
const pino = require('pino')({
  browser: {
    serialize: true
  }
})
```

Or we can selectively enable them via an array:

```js
const pino = require('pino')({
  serializers: {
    custom: myCustomSerializer,
    another: anotherSerializer
  },
  browser: {
    serialize: ['custom']
  }
})
// following will apply myCustomSerializer to the custom property,
// but will not apply anotherSerializer to another key
pino.info({custom: 'a', another: 'b'})
```

When `serialize` is `true` the standard error serializer is also enabled (see https://github.com/pinojs/pino/blob/master/docs/api.md#stdSerializers).
This is a global serializer, which will apply to any `Error` objects passed to the logger methods.

If `serialize` is an array the standard error serializer is also automatically enabled, it can
be explicitly disabled by including a string in the serialize array: `!stdSerializers.err`, like so:

```js
const pino = require('pino')({
  serializers: {
    custom: myCustomSerializer,
    another: anotherSerializer
  },
  browser: {
    serialize: ['!stdSerializers.err', 'custom'] //will not serialize Errors, will serialize `custom` keys
  }
})
```

The `serialize` array also applies to any child logger serializers (see https://github.com/pinojs/pino/blob/master/docs/api.md#discussion-2
for how to set child-bound serializers).

Unlike server pino the serializers apply to every object passed to the logger method,
if the `asObject` option is `true`, this results in the serializers applying to the
first object (as in server pino).

For more info on serializers see https://github.com/pinojs/pino/blob/master/docs/api.md#mergingobject.

### `transmit` (Object)

An object with `send` and `level` properties.

The `transmit.level` property specifies the minimum level (inclusive) of when the `send` function
should be called, if not supplied the `send` function be called based on the main logging `level`
(set via `options.level`, defaulting to `info`).

The `transmit` object must have a `send` function which will be called after
writing the log message. The `send` function is passed the level of the log
message and a `logEvent` object.

The `logEvent` object is a data structure representing a log message, it represents
the arguments passed to a logger statement, the level
at which they were logged, and the hierarchy of child bindings.

The `logEvent` format is structured like so:

```js
{
  ts = Number,
  messages = Array,
  bindings = Array,
  level: { label = String, value = Number}
}
```

The `ts` property is a Unix epoch timestamp in milliseconds, the time is taken from the moment the
logger method is called.

The `messages` array is all arguments passed to logger method, (for instance `logger.info('a', 'b', 'c')`
would result in `messages` array `['a', 'b', 'c']`).

The `bindings` array represents each child logger (if any), and the relevant bindings.
For instance, given `logger.child({a: 1}).child({b: 2}).info({c: 3})`, the bindings array
would hold `[{a: 1}, {b: 2}]` and the `messages` array would be `[{c: 3}]`. The `bindings`
are ordered according to their position in the child logger hierarchy, with the lowest index
being the top of the hierarchy.

By default, serializers are not applied to log output in the browser, but they will *always* be
applied to `messages` and `bindings` in the `logEvent` object. This allows us to ensure a consistent
format for all values between server and client.

The `level` holds the label (for instance `info`), and the corresponding numerical value
(for instance `30`). This could be important in cases where client-side level values and
labels differ from server-side.

The point of the `send` function is to remotely record log messages:

```js
const pino = require('pino')({
  browser: {
    transmit: {
      level: 'warn',
      send: function (level, logEvent) {
        if (level === 'warn') {
          // maybe send the logEvent to a separate endpoint
          // or maybe analyze the messages further before sending
        }
        // we could also use the `logEvent.level.value` property to determine
        // numerical value
        if (logEvent.level.value >= 50) { // covers error and fatal

          // send the logEvent somewhere
        }
      }
    }
  }
})
```

### `disabled` (Boolean)

```js
const pino = require('pino')({browser: {disabled: true}})
```

The `disabled` option will disable logging in browser if set
to `true`, by default it is set to `false`.
