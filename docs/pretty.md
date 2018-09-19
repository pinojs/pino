# Pretty Printing

By default, Pino log lines are newline delimited JSON (NDJSON). This is perfect
for production usage and long term storage. It's not so great for development
environments. Thus, Pino logs can be prettified by using a Pino prettifier
module like [`pino-pretty`][pp]:

```sh
$ cat app.log | pino-pretty
```

For almost all situations, this is the recommended way to prettify logs. The
programmatic API, described in the next section, is primarily for integration
purposes with other CLI based prettifiers.

## Prettifier API

Pino prettifier modules are extra modules that provide a CLI for parsing NDJSON
log lines piped via `stdin` and expose an API which conforms to the Pino
[metadata streams](api.md#metadata) API.

The API requires modules provide a factory function which returns a prettifier
function. This prettifier function must accept either a string of NDJSON or
a Pino log object. A psuedo-example of such a prettifier is:

```js
module.exports = function myPrettifier (options) {
  // Deal with whatever options are supplied.
  return function prettifier (inputData) {
    let logObject
    if (typeof inputData === 'string') {
      const parsedData = someJsonParser(inputData)
      logObject = (isPinoLog(parsedData)) ? parsedData : undefined
    } else if (isObject(inputData) && isPinoLog(inputData)) {
      logObject = inputData
    }
    if (!logObject) return inputData
    // implement prettification
  }

  function isObject (input) {
    return Object.prototype.toString.apply(input) === '[object Object]'
  }

  function isPinoLog (log) {
    return log && (log.hasOwnProperty('v') && log.v === 1)
  }
}
```

The reference implementation of such a module is the [`pino-pretty`][pp] module.
To learn more about creating a custom prettifier module, refer to the
`pino-pretty` source code.

Note: if the prettifier returns `undefined`, instead of a formatted line, nothing
will be written to the destination stream.

### API Example

> #### NOTE:
> For general usage, it is highly recommended that logs are piped into
> the prettifier instead. Prettified logs are not easily parsed and cannot
> be easily investigated at a later date.

1. Install a prettifier module as a separate dependency, e.g. `npm install pino-pretty`.
1. Instantiate the logger with pretty printing enabled:
  ```js
  const pino = require('pino')
  const log = pino({
    prettyPrint: {
      levelFirst: true
    },
    prettifier: require('pino-pretty')
  })
  ```
  Note: the default prettifier module is `pino-pretty`, so the preceding
  example could be:
  ```js
  const pino = require('pino')
  const log = pino({
    prettyPrint: {
      levelFirst: true
    }
  })
  ```
  See the [`pino-pretty` documentation][pp] for more information on the options
  that can be passed via `prettyPrint`.

  [pp]: https://github.com/pinojs/pino-pretty
