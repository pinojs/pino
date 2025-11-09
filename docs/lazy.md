# Lazy Logging
By default, pino logging is not lazy, i.e., the argument to the logging call is evaluated.
In case of expensive calculations, this might degrade the application's performance, even though the log level is not enabled.
See also [`#900`][900].

Luckily, wrapping `pino` to enable lazy logging is rather easy and the following template can be used as a starting point:
```
import { pino } from 'pino'

class LazyPinoLogger extends pino {
  fatal (args) {
    if (super.isLevelEnabled('fatal')) {
      super.fatal(args)
    }
  }

  error (...args) {
    if (super.isLevelEnabled('error')) {
      super.error(...args)
    }
  }

  warn (...args) {
    if (super.isLevelEnabled('warn')) {
      super.warn(...args)
    }
  }

  info (...args) {
    if (super.isLevelEnabled('info')) {
      super.info(...args)
    }
  }

  debug (...args) {
    if (super.isLevelEnabled('debug')) {
      super.debug(...args)
    }
  }

  trace (...args) {
    if (super.isLevelEnabled('trace')) {
      super.trace(...args)
    }
  }
}

const logger = new LazyPinoLogger(
  {
    level: 'debug'
  },
  pino.destination({
  })
)
```

[900]: https://github.com/pinojs/pino/issues/900
