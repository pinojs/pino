
# Benchmarks

`pino.info('hello world')`:

```

BASIC benchmark averages
Bunyan average: 466.070ms
Winston average: 428.970ms
Bole average: 169.615ms
Debug average: 207.668ms
LogLevel average: 229.964ms
Pino average: 384.526ms
PinoExtreme average: 185.094ms
PinoNodeStream average: 156.762ms

```

`pino.info({'hello': 'world'})`:

```

OBJECT benchmark averages
BunyanObj average: 465.168ms
WinstonObj average: 371.508ms
BoleObj average: 190.275ms
LogLevelObject average: 415.969ms
PinoObj average: 406.029ms
PinoExtremeObj average: 199.252ms
PinoNodeStreamObj average: 182.846ms

```

`pino.info(aBigDeeplyNestedObject)`:

```

DEEP-OBJECT benchmark averages
BunyanDeepObj average: 1805.163ms
WinstonDeepObj average: 1967.332ms
BoleDeepObj average: 2206.577ms
LogLevelDeepObj average: 6083.014ms
PinoDeepObj average: 2805.583ms
PinoExtremeDeepObj average: 2244.956ms
PinoNodeStreamDeepObj average: 2290.287ms

```

`pino.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})`:

For a fair comparison, [LogLevel](http://npm.im/loglevel) was extended
to include a timestamp and [bole](http://npm.im/bole) had
`fastTime` mode switched on.

