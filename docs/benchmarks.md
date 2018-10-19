# Benchmarks

`pino.info('hello world')`:

```
BASIC benchmark averages
Bunyan average: 549.042ms
Winston average: 467.873ms
Bole average: 201.529ms
Debug average: 253.724ms
LogLevel average: 282.653ms
Pino average: 188.956ms
PinoExtreme average: 108.809ms
```

`pino.info({'hello': 'world'})`:

```
OBJECT benchmark averages
BunyanObj average: 564.363ms
WinstonObj average: 464.824ms
BoleObj average: 230.220ms
LogLevelObject average: 474.857ms
PinoObj average: 201.442ms
PinoUnsafeObj average: 202.687ms
PinoExtremeObj average: 108.689ms
PinoUnsafeExtremeObj average: 106.718ms
```

`pino.info(aBigDeeplyNestedObject)`:

```
DEEPOBJECT benchmark averages
BunyanDeepObj average: 5293.279ms
WinstonDeepObj average: 9020.292ms
BoleDeepObj average: 9169.043ms
LogLevelDeepObj average: 15260.917ms
PinoDeepObj average: 8467.807ms
PinoUnsafeDeepObj average: 6159.227ms
PinoExtremeDeepObj average: 8354.557ms
PinoUnsafeExtremeDeepObj average: 6214.073ms
```

`pino.info('hello %s %j %d', 'world', {obj: true}, 4, {another: 'obj'})`:

```
BunyanInterpolateExtra average: 778.408ms
WinstonInterpolateExtra average: 627.956ms
BoleInterpolateExtra average: 429.757ms
PinoInterpolateExtra average: 316.043ms
PinoUnsafeInterpolateExtra average: 316.809ms
PinoExtremeInterpolateExtra average: 218.468ms
PinoUnsafeExtremeInterpolateExtra average: 215.040ms
```

For a fair comparison, [LogLevel](http://npm.im/loglevel) was extended
to include a timestamp and [bole](http://npm.im/bole) had
`fastTime` mode switched on.
