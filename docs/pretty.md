# Pretty Printing

By default, Pino log lines are newline delimited JSON. This is perfect for
production usage and long term storage. It's not so great for development
environments. Thus, Pino logs can be prettified by using a Pino prettifier
module like [`pino-pretty`][pp]:

```sh
$ cat app.log | pino-pretty
```

## Prettifier API

Pino prettifier modules are extra modules that provide a CLI for parsing ndJSON
log lines piped via `stdin` and expose an API which conforms to the Pino
[metadata streams](API.md#metadata) API.

The API requires modules provide a factory function which return a prettifier
function. This prettifier function has an `asMetaWrapper(dest)` method attached
to it. A psuedo-example is:

```js
module.exports = function myPrettifier (options) {
  // Deal with whatever options are supplied.
  return function prettifier (inputData) {
    // `inputData` can be an ndJSON string or a Pino log object.
    return `formatted log string`
  }

  function asMetaWrapper (destinationStream) {
    return {
      [Symbol.for('needsMetadata')]: true,
      lastLevel: 0,
      lastMsg: null,
      lastObj: null,
      lastLogger: null,
      write (chunk) {
        destinationStream.write(`formatted log string`)
      }
    }
  }
}
```

The reference implementation of such a module is the [`pino-pretty`][pp] module.
To learn more about creating your own prettifier module, learn from the
`pino-pretty` source code.

## Example

To use pretty printing in your project:

1. Install a prettifier module as a separate dependency, e.g. `npm install --save pino-pretty`.
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
  Note: the default prettifier module is `pino-pretty`, so the preceeding
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
