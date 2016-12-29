![banner](pino-banner.png)

# pino&nbsp;&nbsp;[![Build Status](https://travis-ci.org/pinojs/pino.svg?branch=master)](https://travis-ci.org/pinojs/pino)&nbsp;[![Coverage Status](https://coveralls.io/repos/github/pinojs/pino/badge.svg?branch=master)](https://coveralls.io/github/pinojs/pino?branch=master) [![TypeScript definitions on DefinitelyTyped](http://definitelytyped.org/badges/standard.svg)](http://definitelytyped.org)

[Extremely fast](#benchmarks) node.js logger, inspired by Bunyan.
It also includes a shell utility to pretty-print its log files.

![cli](demo.png)

* [Installation](#install)
* [Usage](#usage)
* [Benchmarks](#benchmarks)
* [API](docs/API.md)
* [Extreme mode explained](docs/extreme.md)
* [Pino Howtos](docs/howtos.md)
* [Transports with Pino](docs/transports.md)
* [Pino in the browser](#browser)
* [Caveats](#caveats)
* [Team](#team)
* [Contributing](#contributing)
* [Acknowledgements](#acknowledgements)
* [License](#license)

## Install

```
npm install pino --save
```

## Usage

```js
'use strict'

var pino = require('pino')()

pino.info('hello world')
pino.error('this is at error level')
pino.info('the answer is %d', 42)
pino.info({ obj: 42 }, 'hello world')
pino.info({ obj: 42, b: 2 }, 'hello world')
pino.info({ obj: { aa: 'bbb' } }, 'another')
setImmediate(function () {
  pino.info('after setImmediate')
})
pino.error(new Error('an error'))

var child = pino.child({ a: 'property' })
child.info('hello child!')

var childsChild = child.child({ another: 'property' })
childsChild.info('hello baby..')

```

This produces:

```
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1459529098958,"v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":50,"msg":"this is at error level","time":1459529098959,"v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"the answer is 42","time":1459529098960,"v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1459529098960,"obj":42,"v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello world","time":1459529098960,"obj":42,"b":2,"v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"another","time":1459529098960,"obj":{"aa":"bbb"},"v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":50,"msg":"an error","time":1459529098961,"type":"Error","stack":"Error: an error\n    at Object.<anonymous> (/Users/davidclements/z/nearForm/pino/example.js:14:12)\n    at Module._compile (module.js:435:26)\n    at Object.Module._extensions..js (module.js:442:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:311:12)\n    at Function.Module.runMain (module.js:467:10)\n    at startup (node.js:136:18)\n    at node.js:963:3","v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello child!","time":1459529098962,"a":"property","v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"hello baby..","time":1459529098962,"another":"property","a":"property","v":1}
{"pid":94473,"hostname":"MacBook-Pro-3.home","level":30,"msg":"after setImmediate","time":1459529098963,"v":1}

```

<a name="benchmarks"></a>
## Benchmarks
As far as we know, it is one of the fastest loggers in town:

`pino.info('hello world')`:

```
benchBunyan*10000: 1355.229ms
benchWinston*10000: 2226.117ms
benchBole*10000: 291.727ms
benchDebug*10000: 445.291ms
benchLogLevel*10000: 322.181ms
benchPino*10000: 269.109ms
benchPinoExreme*10000: 102.239ms
```

`pino.info({'hello': 'world'})`:

```
benchBunyanObj*10000: 1464.568ms
benchWinstonObj*10000: 2177.602ms
benchBoleObj*10000: 322.105ms
benchLogLevelObject*10000: 1443.148ms
benchPinoObj*10000: 309.564ms
benchPinoUnsafeObj*10000: 301.308ms
benchPinoExtremeObj*10000: 130.343ms
benchPinoUnsafeExtremeObj*10000: 131.322ms
```

`pino.info(aBigDeeplyNestedObject)`:

```
benchBunyanDeepObj*10000: 8749.174ms
benchWinstonDeepObj*10000: 17761.409ms
benchBoleDeepObj*10000: 5252.563ms
benchLogLevelDeepObj*10000: 43518.525ms
benchPinoDeepObj*10000: 5124.361ms
benchPinoUnsafeDeepObj*10000: 3539.253ms
benchPinoExtremeDeepObj*10000: 5138.457ms
benchPinoUnsafeExtremeDeepObj*10000: 3480.270ms
```

`pino.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})`:

```
benchDebugInterpolateExtra*10000: 640.001ms
benchBunyanInterpolateExtra*10000: 2888.825ms
benchWinstonInterpolateExtra*10000: 2616.285ms
benchBoleInterpolateExtra*10000: 1313.470ms
benchLogLevelInterpolateExtra*10000: 1487.610ms
benchPinoInterpolateExtra*10000: 486.367ms
benchPinoUnsafeInterpolateExtra*10000: 457.778ms
benchPinoExtremeInterpolateExtra*10000: 314.635ms
benchPinoUnsafeExtremeInterpolateExtra*10000: 294.915ms
```

In many cases, pino is over 6x faster than alternatives.

For a fair comparison, [LogLevel](http://npm.im/loglevel) was extended
to include a timestamp and [bole](http://npm.im/bole) had
`fastTime` mode switched on.

<a name="browser"></a>
## Pino in the browser

Pino is compatible with [`browserify`](http://npm.im) for browser side usage:

This can be useful with isomorphic/universal JavaScript code.

In the browser, `pino` uses corresponding [Log4j](https://en.wikipedia.org/wiki/Log4j) `console` methods (`console.error`, `console.warn`, `console.info`, `console.debug`, `console.trace`) and uses `console.error` for any `fatal` level logs.

<a name="caveats"></a>
## Caveats

There's some fine points to be aware of, which are a result of worthwhile trade-offs:

### 11 Arguments

The logger functions (e.g. `pino.info`) can take a maximum of 11 arguments.

If you need more than that to write a log entry, you're probably doing it wrong.

### Duplicate Keys

It's possible for naming conflicts to arise between child loggers and
children of child loggers.

This isn't as bad as it sounds, even if you do use the same keys between
parent and child loggers Pino resolves the conflict in the sanest way.

For example, consider the following:

```js
var pino = require('pino')
var fs = require('fs')
pino(fs.createWriteStream('./my-log'))
  .child({a: 'property'})
  .child({a: 'prop'})
  .info('howdy')
```

```sh
$ cat my-log
{"pid":95469,"hostname":"MacBook-Pro-3.home","level":30,"msg":"howdy","time":1459534114473,"a":"property","a":"prop","v":1}
```

Notice how there's two key's named `a` in the JSON output. The sub-childs properties
appear after the parent child properties. This means if we run our logs through `pino -t` (or convert them to objects in any other way) we'll end up with one `a` property whose value corresponds to the lowest child in the hierarchy:

```sh
$ cat my-log | pino -t
{"pid":95469,"hostname":"MacBook-Pro-3.home","level":30,"msg":"howdy","time":"2016-04-01T18:08:34.473Z","a":"prop","v":1}
```

This equates to the same log output that Bunyan supplies.

One of Pino's performance tricks is to avoid building objects and stringifying
them, so we're building strings instead. This is why duplicate keys between
parents and children will end up in log output.

<a name="team"></a>
## The Team

### Matteo Collina

<https://github.com/pinojs>

<https://www.npmjs.com/~matteo.collina>

<https://twitter.com/matteocollina>

### David Mark Clements

<https://github.com/davidmarkclements>

<https://www.npmjs.com/~davidmarkclements>

<https://twitter.com/davidmarkclem>

### James Sumners

<https://github.com/jsumners>

<https://www.npmjs.com/~jsumners>

<https://twitter.com/jsumners79>

### Chat on Gitter

<https://gitter.im/pinojs/pino>

## Contributing

Pino is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [CONTRIBUTING.md](https://github.com/pinojs/pino/blob/master/CONTRIBUTING.md) file for more details.

<a name="acknowledgements"></a>
## Acknowledgements

This project was kindly sponsored by [nearForm](http://nearform.com).

Logo and identity designed by Beibhinn Murphy O'Brien: https://www.behance.net/BeibhinnMurphyOBrien.

## License

Licensed under [MIT](./LICENSE).

[elasticsearch]: https://www.elastic.co/products/elasticsearch
[kibana]: https://www.elastic.co/products/kibana
