# pino

[Extremely fast](#benchmarks) node.js logger, inspired by Bunyan.

Still _alpha code_, and in active development.

## Install

```
npm install pino --save
```

## Usage

```js
'use strict'

var pino = require('pino')(
  // or any other stream
  // defaults to stdout
  process.stdout
)
var info = pino.info

info('hello world')
info('the answer is %d', 42)
info({ obj: 42 }, 'hello world')
setImmediate(info, 'wrapped')
```

## Benchmarks

As far as I know, it is the fastest logger in town:

```
benchBunyan*10000: 1128ms
benchWinston*10000: 1903ms
benchBole*10000: 1511ms
benchPino*10000: 439ms
benchBunyanObj*10000: 1209ms
benchWinstonObj*10000: 1948ms
benchPinoObj*10000: 526ms
benchBoleObj*10000: 1466ms
benchBunyan*10000: 1064ms
benchWinston*10000: 1827ms
benchBole*10000: 1524ms
benchPino*10000: 438ms
benchBunyanObj*10000: 1220ms
benchWinstonObj*10000: 2119ms
benchPinoObj*10000: 524ms
benchBoleObj*10000: 1522ms
```

## License

MIT
