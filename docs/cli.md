# CLI

Pino provides a command line interface that can be used to parse Pino log
lines into an easy to read format.

To use the command line tool, we can install `pino` globally:

```sh
npm install -g pino
```

The pretty-printed output will highlight the message value of the input JSON. By
default, Pino provides this message value at the `msg` key. A custom key can be
specified with `-m <key>`.

`pino -m fooMessage` will transform this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"fooMessage":"hello world","time":1457537229339,"v":1}
```

Into this:

```sh
[2016-03-09T15:27:09.339Z] INFO (14139 on MacBook-Pro-3.home): hello world
```

There are also two transformer flags:

+ `-t` that converts Epoch timestamps to ISO timestamps.

    ```sh
    cat log | pino -t
    ```
+ `-l` that flips the time and level on the standard output.

    ```sh
    cat log | pino -l
    ```

`pino -t` will transform this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1457537229339,"v":1}
```

Into this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":"2016-03-09T15:27:09.339Z","v":1}
```


`pino -l` will transform this:

```sh
[2016-03-09T15:27:09.339Z] INFO (14139 on MacBook-Pro-3.home): hello world
```

Into this:

```sh
INFO [2016-03-09T15:27:09.339Z] (14139 on MacBook-Pro-3.home): hello world
```
If you would like to enforce the output to be color encoded you can specify the `-c` flag
`cat log | pino -c` will transform this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"fooMessage":"hello world","time":1457537229339,"v":1}
```

Into this:

```sh
[2017-04-25T17:32:09.662Z] [32mINFO[39m (24280 on SP2): [36mhello world[39m
```
