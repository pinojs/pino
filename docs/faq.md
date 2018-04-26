# Frequently Asked Questions

+ [How do I filter logs?](#filter-logs)
+ [How do I automatically add something to every log?](#auto-add)
+ [How do I stop `name` from being overwritten?](#dupe-props)
+ [How do I use a transport with systemd?](#transport-systemd)
+ [How do I make the level show as the name instead of the value?](#level-string)

<a id="filter-logs"></a>
## How do I filter logs?
The Pino authors are firm believers in using common, pre-existing, system
utilities. Thus, some recommendations for this are:

1. Use [`grep`](https://linux.die.net/man/1/grep):
    ```sh
    $ # View all "INFO" level logs
    $ node your_app.js | grep '"level":30'
    ```
1. Use [`jq`](https://stedolan.github.io/jq/):
    ```sh
    $ # View all "ERROR" level logs
    $ node node_app.js | jq 'select(.level == 50)'
    ```

<a id="auto-add"></a>
Let's assume you want to have `"module":"foo"` added to every log within a
module `foo.js`. To accomplish this, simply use a child logger:

```js
'use strict'
// exports an instance of `require('pino')()`
const log = require('./logger').child({module: 'foo'})

function doSomething () {
  log.info('doSomething invoked')
}

module.exports = {
  doSomething
}
```

<a id="transport-systemd"></a>
## How do I use a transport with systemd?
`systemd` makes it complicated to use pipes in services. One method for overcoming
this challenge is to use a subshell:

```
ExecStart=/bin/sh -c '/path/to/node your_app.js | pino-transport'
```

<a id="dupe-props"></a>
See the documentation on [duplicate keys](https://github.com/pinojs/pino#duplicate-keys).

<a id="level-string"></a>
## How do I make the level show as the name instead of the string?
Pino log lines are meant to be parseable. Thus, there isn't any built-in option
to change the level from the integer value to the string name. However, there
are a couple of options:

1. If the only change desired is the name, i.e. you want to retain the newline
delimited JSON, then you can use a transport to make the change. One such
transport is [`pino-text-level-transport`](https://npm.im/pino-text-level-transport).
1. Use a prettifier like [`pino-pretty`](https://npm.im/pino-pretty) to make
the logs human friendly.
