# Benchmarks

`pino.info('hello world')`:

```
BASIC benchmark averages
Bunyan average: 775.758ms
Winston average: 673.231ms
Bole average: 466.211ms
Debug average: 469.900ms
LogLevel average: 464.293ms
Pino average: 383.885ms
PinoAsync average: 180.870ms
PinoNodeStream average: 385.438ms
```

`pino.info({'hello': 'world'})`:

```
OBJECT benchmark averages
BunyanObj average: 833.112ms
WinstonObj average: 723.240ms
BoleObj average: 512.905ms
LogLevelObject average: 853.441ms
PinoObj average: 397.299ms
PinoAsyncObj average: 186.173ms
PinoNodeStreamObj average: 408.604ms
```

`pino.info(aBigDeeplyNestedObject)`:

```
DEEPOBJECT benchmark averages
BunyanDeepObj average: 2.411ms
WinstonDeepObj average: 4.112ms
BoleDeepObj average: 3.896ms
LogLevelDeepObj average: 10.800ms
PinoDeepObj average: 4.080ms
PinoAsyncDeepObj average: 3.938ms
PinoNodeStreamDeepObj average: 4.232ms
```

`pino.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})`:

```
BunyanInterpolateExtra average: 1.225ms
WinstonInterpolateExtra average: 618.904ms
BoleInterpolateExtra average: 796.188ms
PinoInterpolateExtra average: 522.410ms
PinoAsyncInterpolateExtra average: 332.498ms
PinoNodeStreamInterpolateExtra average: 545.632ms
```

For a fair comparison, [LogLevel](http://npm.im/loglevel) was extended
to include a timestamp and [bole](http://npm.im/bole) had
`fastTime` mode switched on.
