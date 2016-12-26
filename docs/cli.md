# CLI

Pino provides a command line interface that can be used to parse Pino log
lines into an easy to read format.

To use the command line tool, we can install `pino` globally:

```sh
npm install -g pino
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
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1457537229339,"v":0}
```

Into this:

```js
{"pid":14139,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":"2016-03-09T15:27:09.339Z","v":0}
```


`pino -l` will transform this:

```sh
[2016-03-09T15:27:09.339Z] INFO (14139 on MacBook-Pro-3.home): hello world
```

Into this:

```sh
INFO [2016-03-09T15:27:09.339Z] (14139 on MacBook-Pro-3.home): hello world
```