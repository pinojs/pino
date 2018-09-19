# Help

* [Exit logging](#exit-logging)
* [Log rotation](#rotate)
* [Reopening log files](#reopening)
* [Saving to multiple files](#multiple)
* [Log filtering](#filter-logs)
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

To write logs in an exit handler, create the handler with [`pino.final`](/docs/api.md#pino-final):

```js
process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
  finalLogger.error(err, 'uncaughtException')
  process.exit(1)
}))

process.on('unhandledRejection', pino.final(logger, (err, finalLogger) => {
  finalLogger.error(err, 'unhandledRejection')
  process.exit(1)
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

The `copytruncate` configuration has a very slight possibility of lost log lines due
to a gap between copying and truncating - the truncate may occur after additional lines
have been written. To perform log rotation without `copytruncate`, see the [Reopening log files](#reopening)
help.

<a id="reopening"></a>
## Reopening log files

In cases where a log rotation tool doesn't offer a copy-truncate capabilities,
or where using them is deemed inappropriate `pino.destination` and `pino.extreme`
destinations are able to reopen file paths after a file has been moved away.

One way to use this is to set up a `SIGUSR2` or `SIGHUP` signal handler that
reopens the log file destination, making sure to write the process PID out
somewhere so the log rotation tool knows where to send the signal.

```js
// write the process pid to a well known location for later
const fs = require('fs')
fs.writeFileSync('/var/run/myapp.pid', process.pid)

const dest = pino.destination('/log/file') // pino.extreme will also work
const logger = require('pino')(dest)
process.on('SIGHUP', () => dest.reopen())
```

The log rotation tool can then be configured to send this signal to the process
after a log rotation event has occurred.

Given a similar scenario as in the [Log rotation](#rotate) section a basic
`logrotate` config that aligns with this strategy would look similar to the following:

```
/var/log/myapp.log {
       su root
       daily
       rotate 7
       delaycompress
       compress
       notifempty
       missingok
       postrotate
           kill -HUP `cat /var/run/myapp.pid`
       endscript
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
Pino log lines are meant to be parseable. Thus, Pino's default mode of operation
is to print the level value instead of the string name. However, while it is
possible to set the `useLevelLabels` option, we recommend using one of these
options instead if you are able:

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
