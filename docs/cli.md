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

If an instance of `Error` is logged, Pino adds `"type":"Error"` to the logged JSON.
Thus, when prettifying the output, Pino will transform the JSON:

```js
{"level":50,"time":1457537229339,"msg":"Error message.","pid":44127,"hostname":"MacBook-Pro-3.home","type":"Error","stack":"Stack of the error","statusCode":500,"dataBaseSpecificError":{"errorType":"some database error type","erroMessage":"some database error message","evenMoreSpecificStuff":{"someErrorRelatedObject":"error"}},"v":1}
```

To:

```sh
ERROR [2016-03-09T15:27:09.339Z] (44127 on MacBook-Pro-3.home): Error message.
    Stack of the error
```

To log additional properties of `Error` objects, supply the `--errorProps <properties>` flag.

For example, `pino --errorProps statusCode` will transform:

```js
{"level":50,"time":1457537229339,"msg":"Error message.","pid":44127,"hostname":"MacBook-Pro-3.home","type":"Error","stack":"Stack of the error","statusCode":500,"dataBaseSpecificError":{"errorType":"some database error type","erroMessage":"some database error message","evenMoreSpecificStuff":{"someErrorRelatedObject":"error"}},"v":1}
```

To:

```sh
ERROR [2016-03-09T15:27:09.339Z] (44127 on MacBook-Pro-3.home): Error message.
    Stack of the error
statusCode: 500
```

In order to print all nested properties of `Error` objects, you can use `--errorProps` flag with `*` property.

Note: you must quote or escape the `*` (asterisk) to avoid shell expansion.

`pino --errorProps '*'` will transform:

```js
{"level":50,"time":1457537229339,"msg":"Error message.","pid":44127,"hostname":"MacBook-Pro-3.home","type":"Error","stack":"Stack of the error","statusCode":500,"dataBaseSpecificError":{"errorType":"some database error type","erroMessage":"some database error message","evenMoreSpecificStuff":{"someErrorRelatedObject":"error"}},"v":1}
```

To:

```sh
[2016-03-09T15:27:09.339Z] ERROR (44127 on MacBook-Pro-3.home): Error message.
    Stack of the error
statusCode: 500
dataBaseSpecificError: {
    errorType: "some database error type"
    erroMessage: "some database error message"
    evenMoreSpecificStuff: {
      "someErrorRelatedObject": "error"
    }
}
```
