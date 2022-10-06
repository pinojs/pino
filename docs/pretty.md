# Pretty Printing

By default, Pino log lines are newline delimited JSON (NDJSON). This is perfect
for production usage and long-term storage. It's not so great for development
environments. Thus, Pino logs can be prettified by using a Pino prettifier
module like [`pino-pretty`][pp]:

```sh
$ cat app.log | pino-pretty
```

For almost all situations, this is the recommended way to prettify logs. The
programmatic API, described in the next section, is primarily for integration
purposes with other CLI-based prettifiers.

## Prettifier API

Pino prettifier modules are extra modules that provide a CLI for parsing NDJSON
log lines piped via `stdin` and expose an API that conforms to the Pino
[metadata streams](/docs/api.md#metadata) API.

The API requires modules provide a factory function that returns a prettifier
function. This prettifier function must accept either a string of NDJSON or
a Pino log object. A pseudo-example of such a prettifier is:

The uninitialized Pino instance is passed as `this` into prettifier factory function,
so it can be accessed via closure by the returned prettifier function.

```js
module.exports = function myPrettifier (options) {
  // `this` is bound to the pino instance
  // Deal with whatever options are supplied.
  return function prettifier (inputData) {
    let logObject
    if (typeof inputData === 'string') {
      logObject = someJsonParser(inputData)
    } else if (isObject(inputData)) {
      logObject = inputData
    }
    if (!logObject) return inputData
    // implement prettification
  }

  function isObject (input) {
    return Object.prototype.toString.apply(input) === '[object Object]'
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
1. Instantiate the logger with the prettifier option:
  ```js
  const pino = require('pino')
  const log = pino({
    prettifier: require('pino-pretty')
  })
  ```

  [pp]: https://github.com/pinojs/pino-pretty
