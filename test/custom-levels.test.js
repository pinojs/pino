'use strict'

const { test } = require('tap')
const { sink, once } = require('./helper')
const pino = require('../')

test('adds additional levels', async ({is}) => {
  const stream = sink()
  const logger = pino({
    customLevels: {
      foo: 35,
      bar: 45
    }
  }, stream)

  logger.foo('test')
  const { level } = await once(stream, 'data')
  is(level, 35)
})

test('throws when specifying existing levels', async ({is, throws}) => {
  const stream = sink()
  throws(() => pino({
    customLevels: {
      info: 35
    }
  }, stream)
  )
  try {
    pino({
      customLevels: {
        info: 35
      }
    })
  } catch ({message}) {
    is(message, 'levels cannot be overridden')
  }
})

test('throws when specifying existing values', async ({is, throws}) => {
  const stream = sink()
  throws(() => pino({
    customLevels: {
      foo: 30
    }
  }, stream)
  )
  try {
    pino({
      customLevels: {
        foo: 30
      }
    })
  } catch ({message}) {
    is(message, 'pre-existing level values cannot be used for new levels')
  }
})

test('custom levels are inherited by children', async ({is}) => {
  const stream = sink()
  const logger = pino({
    customLevels: {
      foo: 35
    }
  }, stream)

  logger.child({childMsg: 'ok'}).foo('test')
  const { msg, childMsg, level } = await once(stream, 'data')
  is(level, 35)
  is(childMsg, 'ok')
  is(msg, 'test')
})

test('custom levels can be specified on child bindings', async ({is}) => {
  const stream = sink()
  const logger = pino(stream).child({
    customLevels: {
      foo: 35
    },
    childMsg: 'ok'
  })

  logger.foo('test')
  const { msg, childMsg, level } = await once(stream, 'data')
  is(level, 35)
  is(childMsg, 'ok')
  is(msg, 'test')
})

test('customLevels property child bindings does not get logged', async ({is}) => {
  const stream = sink()
  const logger = pino(stream).child({
    customLevels: {
      foo: 35
    },
    childMsg: 'ok'
  })

  logger.foo('test')
  const { customLevels } = await once(stream, 'data')
  is(customLevels, undefined)
})

test('throws when specifying core levels via child bindings', async ({is, throws}) => {
  const stream = sink()
  throws(() => pino(stream).child({
    customLevels: {
      info: 35
    }
  })
  )
  try {
    pino(stream).child({
      customLevels: {
        info: 35
      }
    })
  } catch ({message}) {
    is(message, 'levels cannot be overridden')
  }
})

test('throws when specifying core values via child bindings', async ({is, throws}) => {
  const stream = sink()
  throws(() => pino(stream).child({
    customLevels: {
      foo: 30
    }
  })
  )
  try {
    pino(stream).child({
      customLevels: {
        foo: 30
      }
    })
  } catch ({message}) {
    is(message, 'pre-existing level values cannot be used for new levels')
  }
})

test('throws when specifying pre-existing parent levels via child bindings', async ({is, throws}) => {
  const stream = sink()
  throws(() => pino({
    customLevels: {
      foo: 35
    }
  }, stream).child({
    customLevels: {
      foo: 45
    }
  })
  )
  try {
    pino({
      customLevels: {
        foo: 35
      }
    }, stream).child({
      customLevels: {
        foo: 45
      }
    })
  } catch ({message}) {
    is(message, 'levels cannot be overridden')
  }
})

test('throws when specifying pre-existing parent values via child bindings', async ({is, throws}) => {
  const stream = sink()
  throws(() => pino({
    customLevels: {
      foo: 35
    }
  }, stream).child({
    customLevels: {
      bar: 35
    }
  })
  )
  try {
    pino({
      customLevels: {
        foo: 35
      }
    }, stream).child({
      customLevels: {
        bar: 35
      }
    })
  } catch ({message}) {
    is(message, 'pre-existing level values cannot be used for new levels')
  }
})

test('custom level on one instance does not affect other instances', async ({is}) => {
  pino({customLevels: {
    foo: 37
  }})
  is(typeof pino().foo, 'undefined')
})

test('setting level below or at custom level will successfully log', async ({is}) => {
  const stream = sink()
  const instance = pino({customLevels: {foo: 35}}, stream)
  instance.level = 'foo'
  instance.info('nope')
  instance.foo('bar')
  const { msg } = await once(stream, 'data')
  is(msg, 'bar')
})

test('custom level below level threshold will not log', async ({is}) => {
  const stream = sink()
  const instance = pino({customLevels: {foo: 15}}, stream)
  instance.level = 'info'
  instance.info('bar')
  instance.foo('nope')
  const { msg } = await once(stream, 'data')
  is(msg, 'bar')
})

test('can add a custom level with addLevel', async ({is}) => {
  const stream = sink()
  const instance = pino(stream)
  instance.addLevel('foo2', 35)
  is(typeof instance.foo2, 'function')
  instance.foo2('bar')
  const { msg } = await once(stream, 'data')
  is(msg, 'bar')
})

test('custom level via addLevel on one instance does not affect other instances', async ({is}) => {
  const instance = pino()
  instance.addLevel('foo', 37)
  const other = pino()
  instance.addLevel('bar', 38)
  is(typeof other.foo, 'undefined')
  is(typeof other.bar, 'undefined')
})

test('setting level below or at custom level (added with addLevel) will successfully log', async ({is}) => {
  const stream = sink()
  const instance = pino(stream)
  instance.addLevel('foo', 35)
  instance.level = 'foo'
  instance.info('nope')
  instance.foo('bar')
  const { msg } = await once(stream, 'data')
  is(msg, 'bar')
})

test('custom level (added with addLevel) addLevel below level threshold will not log', async ({is}) => {
  const stream = sink()
  const instance = pino(stream)
  instance.level = 'info'
  instance.addLevel('foo', 15)
  instance.info('bar')
  instance.foo('nope')
  const { msg } = await once(stream, 'data')
  is(msg, 'bar')
})

test('throws when specifying core levels via addLevel', async ({is, throws}) => {
  const stream = sink()
  throws(() => {
    const logger = pino(stream)
    logger.addLevel('info', 35)
  })
  try {
    const logger = pino(stream)
    logger.addLevel('info', 35)
  } catch ({message}) {
    is(message, 'levels cannot be overridden')
  }
})

test('throws when specifying core values via addLevel', async ({is, throws}) => {
  const stream = sink()
  throws(() => {
    const logger = pino(stream)
    logger.addLevel('foo', 30)
  })
  try {
    const logger = pino(stream)
    logger.addLevel('foo', 30)
  } catch ({message}) {
    is(message, 'pre-existing level values cannot be used for new levels')
  }
})

test('throws when re-specifying pre-configured custom level labels via addLevel', async ({is, throws}) => {
  const stream = sink()
  throws(() => {
    const logger = pino({customLevels: {foo: 35}}, stream)
    logger.addLevel('foo', 35)
  })
  try {
    const logger = pino({customLevels: {foo: 35}}, stream)
    logger.addLevel('foo', 45)
  } catch ({message}) {
    is(message, 'levels cannot be overridden')
  }
})

test('throws when re-specifying pre-configured custom level values via addLevel', async ({is, throws}) => {
  const stream = sink()
  throws(() => {
    const logger = pino({customLevels: {foo: 35}}, stream)
    logger.addLevel('foo', 35)
  })
  try {
    const logger = pino({customLevels: {foo: 35}}, stream)
    logger.addLevel('bar', 35)
  } catch ({message}) {
    is(message, 'pre-existing level values cannot be used for new levels')
  }
})

test('does not share custom level state across siblings', async ({doesNotThrow}) => {
  const stream = sink()
  const logger = pino(stream)
  const child = logger.child({})
  child.addLevel('foo', 35)
  doesNotThrow(() => {
    const child = logger.child({})
    child.addLevel('foo', 35) // should not throw an error about level override
  })
})
