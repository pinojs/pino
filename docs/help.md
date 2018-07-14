# Help

* [Log rotation](#rotate)
* [Saving to multiple files](#multiple)
* [Log Filtering](#filter-logs)
* [How do I use a transport with systemd?](#transport-systemd)
* [Duplicate keys](#dupe-keys)
* [Log levels as labels instead of numbers](#level-string)
* [Pino with `debug`](#debug)

<a id="rotate"></a>
## Log rotation

Use a separate tool for log rotation:
We recommend [logrotate](https://github.com/logrotate/logrotate).
Consider we output our logs to `/var/log/myapp.log` like so:

```
> node server.js > /var/log/myapp.log
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

Let's assume you want to store all error messages to a separate log file:

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

<a id="transport-systemd"></a>
## How do I use a transport with systemd?
`systemd` makes it complicated to use pipes in services. One method for overcoming
this challenge is to use a subshell:

```
ExecStart=/bin/sh -c '/path/to/node your_app.js | pino-transport'
```

<a id="dupe-keys"></a>
## How Pino handles duplicate keys
See the documentation on [duplicate keys](https://github.com/pinojs/pino#duplicate-keys).

<a id="level-string"></a>
## Log levels as labels instead of numbers
Pino log lines are meant to be parseable. Thus, there isn't any built-in option
to change the level from the integer value to the string name. However, there
are a couple of options:

1. If the only change desired is the name, i.e. you want to retain the newline
delimited JSON, then you can use a transport to make the change. One such
transport is [`pino-text-level-transport`](https://npm.im/pino-text-level-transport).
1. Use a prettifier like [`pino-pretty`](https://npm.im/pino-pretty) to make
the logs human friendly.

<a id="debug"></a>
## Pino with `debug`
Capture debug logs in JSON format, at 10x-20x the speed:
The popular [`debug`](http://npm.im/debug) which
used in many modules accross the ecosystem.

The [`pino-debug`](http://github.com/pinojs/pino-debug)
can captures calls to the `debug` loggers and run them
through `pino` instead. This results in a 10x (20x in extreme mode)
performance improvement, while logging out more information, in the
usual JSON format.

The quick start way to enable this is simply to install [`pino-debug`](http://github.com/pinojs/pino-debug)
and preload it with the `-r` flag, enabling any `debug` logs with the
`DEBUG` environment variable:

```sh
$ npm i pino-debug
$ DEBUG=* node -r pino-debug app.js
```

[`pino-debug`](http://github.com/pinojs/pino-debug) also offers fine grain control to map specific `debug`
namespaces to `pino` log levels. See [`pino-debug`](http://github.com/pinojs/pino-debug)
for more.