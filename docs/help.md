# Help

* [Exit logging](#exit-logging)
* [Log rotation](#rotate)
* [Saving to multiple files](#multiple)
* [Log Filtering](#filter-logs)
* [Transports and systemd](#transport-systemd)
* [Duplicate keys](#dupe-keys)
* [Log levels as labels instead of numbers](#level-string)
* [Pino with `debug`](#debug)

<a id="exit-logging"></a>
## Exit logging

When a Node process crashes from uncaught exception, exits due to a signal, 
or exits of it's own accord we may want to write some final logs – particularly
in cases of error. 

Writing to a Node.js stream on exit is not necessarily guaranteed, and naively writing
to an Extreme Mode logger on exit will definitely lead to lost logs. 

To write logs in an exit handler, create the handler with `pino.final`:

```js
process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
  finalLogger.error(err)
}))
```

The `finalLogger` is a special logger instance that will synchronously and reliably 
flush every log line. This is important in exit handlers, since no more asynchronous
activity may be scheduled.

<a id="rotate"></a>
## Log rotation

Use a separate tool for log rotation:
We recommend [logrotate](https://github.com/logrotate/logrotate).
Consider we output our logs to `/var/log/myapp.log` like so:

```
$ node server.js > /var/log/myapp.log
```

We would rotate our log files with logrotate, by adding the following to `/etc/logrotate.d/myapp`:

```
/var/log/myapp.log {
       su root
       daily
       rotate 7
       delaycompress
       compress
       notifempty
       missingok
       copytruncate
}
```

<a id="multiple"></a>
## Saving to multiple files

Let's assume we want to store all error messages to a separate log file.

Install [pino-tee](http://npm.im/pino-tee) with:

```bash
npm i pino-tee -g
```

The following writes the log output of `app.js` to `./all-logs`, while
writing only warnings and errors to `./warn-log:

```bash
node app.js | pino-tee warn ./warn-logs > ./all-logs
```

<a id="filter-logs"></a>
## Log Filtering
The Pino philosophy advocates common, pre-existing, system utilities. 

Some recommendations in line with this philosophy are:

1. Use [`grep`](https://linux.die.net/man/1/grep):
    ```sh
    $ # View all "INFO" level logs
    $ node app.js | grep '"level":30'
    ```
1. Use [`jq`](https://stedolan.github.io/jq/):
    ```sh
    $ # View all "ERROR" level logs
    $ node app.js | jq 'select(.level == 50)'
    ```

<a id="transport-systemd"></a>
## Transports and systemd
`systemd` makes it complicated to use pipes in services. One method for overcoming
this challenge is to use a subshell:

```
ExecStart=/bin/sh -c '/path/to/node app.js | pino-transport'
```

<a id="dupe-keys"></a>
## How Pino handles duplicate keys

Duplicate keys are possibly when a child logger logs an object with a key that
collides with a key in the child loggers bindings. 

See the [child logger duplicate keys caveat](/docs/child-loggers.md#duplicate-keys-caveat)
for information on this is handled.

<a id="level-string"></a>
## Log levels as labels instead of numbers
Pino log lines are meant to be parseable. Thus, there isn't any built-in option
to change the level from the integer value to the string name. However, there
are a couple of options:

1. If the only change desired is the name then a transport can be used. One such
transport is [`pino-text-level-transport`](https://npm.im/pino-text-level-transport).
1. Use a prettifier like [`pino-pretty`](https://npm.im/pino-pretty) to make
the logs human friendly.

<a id="debug"></a>
## Pino with `debug`

The popular [`debug`](http://npm.im/debug) is used in many modules across the ecosystem. 

The [`pino-debug`](http://github.com/pinojs/pino-debug) module
can capture calls to `debug` loggers and run them
through `pino` instead. This results in a 10x (20x in extreme mode)
performance improvement - event though `pino-debug` is logging additional 
data and wrapping it in JSON.

To quickly enable this install [`pino-debug`](http://github.com/pinojs/pino-debug)
and preload it with the `-r` flag, enabling any `debug` logs with the
`DEBUG` environment variable:

```sh
$ npm i pino-debug
$ DEBUG=* node -r pino-debug app.js
```

[`pino-debug`](http://github.com/pinojs/pino-debug) also offers fine grain control to map specific `debug`
namespaces to `pino` log levels. See [`pino-debug`](http://github.com/pinojs/pino-debug)
for more.