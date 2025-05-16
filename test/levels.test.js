'use strict'

const { describe, test } = require('node:test')
const { sink, once, check } = require('./helper')
const pino = require('../')

const levelsLib = require('../lib/levels')

// Silence all warnings for this test
process.removeAllListeners('warning')
process.on('warning', () => {})

test('set the level by string', async (t) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const stream = sink()
  const instance = pino(stream)
  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  const result = await once(stream, 'data')
  const current = expected.shift()
  check(t.assert.strictEqual, result, current.level, current.msg)
})

test('the wrong level throws', async (t) => {
  const instance = pino()
  t.assert.throws(() => {
    instance.level = 'kaboom'
  })
})

test('set the level by number', async (t) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const stream = sink()
  const instance = pino(stream)

  instance.level = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  const result = await once(stream, 'data')
  const current = expected.shift()
  check(t.assert.strictEqual, result, current.level, current.msg)
})

test('exposes level string mappings', async (t) => {
  t.assert.strictEqual(pino.levels.values.error, 50)
})

test('exposes level number mappings', async (t) => {
  t.assert.strictEqual(pino.levels.labels[50], 'error')
})

test('returns level integer', async (t) => {
  const instance = pino({ level: 'error' })
  t.assert.strictEqual(instance.levelVal, 50)
})

test('child returns level integer', async (t) => {
  const parent = pino({ level: 'error' })
  const child = parent.child({ foo: 'bar' })
  t.assert.strictEqual(child.levelVal, 50)
})

test('set the level via exported pino function', async (t) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const stream = sink()
  const instance = pino({ level: 'error' }, stream)

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
  const result = await once(stream, 'data')
  const current = expected.shift()
  check(t.assert.strictEqual, result, current.level, current.msg)
})

test('level-change event', async (t) => {
  const instance = pino()
  function handle (lvl, val, prevLvl, prevVal, logger) {
    t.assert.strictEqual(lvl, 'trace')
    t.assert.strictEqual(val, 10)
    t.assert.strictEqual(prevLvl, 'info')
    t.assert.strictEqual(prevVal, 30)
    t.assert.strictEqual(logger, instance)
  }
  instance.on('level-change', handle)
  instance.level = 'trace'
  instance.removeListener('level-change', handle)
  instance.level = 'info'

  let count = 0

  const l1 = () => count++
  const l2 = () => count++
  const l3 = () => count++
  instance.on('level-change', l1)
  instance.on('level-change', l2)
  instance.on('level-change', l3)

  instance.level = 'trace'
  instance.removeListener('level-change', l3)
  instance.level = 'fatal'
  instance.removeListener('level-change', l1)
  instance.level = 'debug'
  instance.removeListener('level-change', l2)
  instance.level = 'info'

  t.assert.strictEqual(count, 6)

  instance.once('level-change', (lvl, val, prevLvl, prevVal, logger) => t.assert.strictEqual(logger, instance))
  instance.level = 'info'
  const child = instance.child({})
  instance.once('level-change', (lvl, val, prevLvl, prevVal, logger) => t.assert.strictEqual(logger, child))
  child.level = 'trace'
})

test('enable', async (t) => {
  const instance = pino({
    level: 'trace',
    enabled: false
  }, sink((result, enc) => {
    t.assert.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })
})

test('silent level', async (t) => {
  const instance = pino({
    level: 'silent'
  }, sink((result, enc) => {
    t.assert.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })
})

test('set silent via Infinity', async (t) => {
  const instance = pino({
    level: Infinity
  }, sink((result, enc) => {
    t.assert.fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })
})

test('exposed levels', async (t) => {
  t.assert.deepStrictEqual(Object.keys(pino.levels.values), [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal'
  ])
})

test('exposed labels', async (t) => {
  t.assert.deepStrictEqual(Object.keys(pino.levels.labels), [
    '10',
    '20',
    '30',
    '40',
    '50',
    '60'
  ])
})

test('setting level in child', async (t) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const instance = pino(sink((result, enc, cb) => {
    const current = expected.shift()
    check(t.assert.strictEqual, result, current.level, current.msg)
    cb()
  })).child({ level: 30 })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('setting level by assigning a number to level', async (t) => {
  const instance = pino()
  t.assert.strictEqual(instance.levelVal, 30)
  t.assert.strictEqual(instance.level, 'info')
  instance.level = 50
  t.assert.strictEqual(instance.levelVal, 50)
  t.assert.strictEqual(instance.level, 'error')
})

test('setting level by number to unknown value results in a throw', async (t) => {
  const instance = pino()
  t.assert.throws(() => { instance.level = 973 })
})

test('setting level by assigning a known label to level', async (t) => {
  const instance = pino()
  t.assert.strictEqual(instance.levelVal, 30)
  t.assert.strictEqual(instance.level, 'info')
  instance.level = 'error'
  t.assert.strictEqual(instance.levelVal, 50)
  t.assert.strictEqual(instance.level, 'error')
})

test('levelVal is read only', async (t) => {
  const instance = pino()
  t.assert.throws(() => { instance.levelVal = 20 })
})

test('produces labels when told to', async (t) => {
  const expected = [{
    level: 'info',
    msg: 'hello world'
  }]
  const instance = pino({
    formatters: {
      level (label, number) {
        return { level: label }
      }
    }
  }, sink((result, enc, cb) => {
    const current = expected.shift()
    check(t.assert.strictEqual, result, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
})

test('resets levels from labels to numbers', async (t) => {
  const expected = [{
    level: 30,
    msg: 'hello world'
  }]
  pino({ useLevelLabels: true })
  const instance = pino({ useLevelLabels: false }, sink((result, enc, cb) => {
    const current = expected.shift()
    check(t.assert.strictEqual, result, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
})

test('changes label naming when told to', async (t) => {
  const expected = [{
    priority: 30,
    msg: 'hello world'
  }]
  const instance = pino({
    formatters: {
      level (label, number) {
        return { priority: number }
      }
    }
  }, sink((result, enc, cb) => {
    const current = expected.shift()
    t.assert.strictEqual(result.priority, current.priority)
    t.assert.strictEqual(result.msg, current.msg)
    cb()
  }))

  instance.info('hello world')
})

test('children produce labels when told to', async (t) => {
  const expected = [
    {
      level: 'info',
      msg: 'child 1'
    },
    {
      level: 'info',
      msg: 'child 2'
    }
  ]
  const instance = pino({
    formatters: {
      level (label, number) {
        return { level: label }
      }
    }
  }, sink((result, enc, cb) => {
    const current = expected.shift()
    check(t.assert.strictEqual, result, current.level, current.msg)
    cb()
  }))

  const child1 = instance.child({ name: 'child1' })
  const child2 = child1.child({ name: 'child2' })

  child1.info('child 1')
  child2.info('child 2')
})

test('produces labels for custom levels', async (t) => {
  const expected = [
    {
      level: 'info',
      msg: 'hello world'
    },
    {
      level: 'foo',
      msg: 'foobar'
    }
  ]
  const opts = {
    formatters: {
      level (label, number) {
        return { level: label }
      }
    },
    customLevels: {
      foo: 35
    }
  }
  const instance = pino(opts, sink((result, enc, cb) => {
    const current = expected.shift()
    check(t.assert.strictEqual, result, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
  instance.foo('foobar')
})

test('setting levelKey does not affect labels when told to', async (t) => {
  const instance = pino(
    {
      formatters: {
        level (label, number) {
          return { priority: label }
        }
      }
    },
    sink((result, enc, cb) => {
      t.assert.strictEqual(result.priority, 'info')
      cb()
    })
  )

  instance.info('hello world')
})

test('throws when creating a default label that does not exist in logger levels', async (t) => {
  const defaultLevel = 'foo'
  t.assert.throws(() => {
    pino({
      customLevels: {
        bar: 5
      },
      level: defaultLevel
    })
  }, {
    message: `default level:${defaultLevel} must be included in custom levels`
  })
})

test('throws when creating a default value that does not exist in logger levels', async (t) => {
  const defaultLevel = 15
  t.assert.throws(() => {
    pino({
      customLevels: {
        bar: 5
      },
      level: defaultLevel
    })
  }, {
    message: `default level:${defaultLevel} must be included in custom levels`
  })
})

test('throws when creating a default value that does not exist in logger levels', async (t) => {
  t.assert.throws(() => {
    pino({
      customLevels: {
        foo: 5
      },
      useOnlyCustomLevels: true
    })
  }, {
    message: 'default level:info must be included in custom levels'
  })
})

test('passes when creating a default value that exists in logger levels', async (t) => {
  pino({
    level: 30
  })
})

test('log null value when message is null', async (t) => {
  const expected = {
    msg: null,
    level: 30
  }

  const stream = sink()
  const instance = pino(stream)
  instance.level = 'info'
  instance.info(null)

  const result = await once(stream, 'data')
  check(t.assert.strictEqual, result, expected.level, expected.msg)
})

test('formats when base param is null', async (t) => {
  const expected = {
    msg: 'a string',
    level: 30
  }

  const stream = sink()
  const instance = pino(stream)
  instance.level = 'info'
  instance.info(null, 'a %s', 'string')

  const result = await once(stream, 'data')
  check(t.assert.strictEqual, result, expected.level, expected.msg)
})

test('fatal method sync-flushes the destination if sync flushing is available', async t => {
  t.plan(2)
  const stream = sink()
  stream.flushSync = () => {
    t.assert.ok('destination flushed')
  }
  const instance = pino(stream)
  instance.fatal('this is fatal')
  await once(stream, 'data')
  t.assert.doesNotThrow(() => {
    stream.flushSync = undefined
    instance.fatal('this is fatal')
  })
})

test('fatal method should call async when sync-flushing fails', t => {
  t.plan(2)
  const messages = [
    'this is fatal 1'
  ]
  const stream = sink((result) => t.assert.strictEqual(result.msg, messages.shift()))
  stream.flushSync = () => { throw new Error('Error') }
  stream.flush = () => t.assert.fail('flush should be called')

  const instance = pino(stream)
  t.assert.doesNotThrow(() => instance.fatal(messages[0]))
})

test('calling silent method on logger instance', async (t) => {
  const instance = pino({ level: 'silent' }, sink((result, enc) => {
    t.assert.fail('no data should be logged')
  }))
  instance.silent('hello world')
})

test('calling silent method on child logger', async (t) => {
  const child = pino({ level: 'silent' }, sink((result, enc) => {
    t.assert.fail('no data should be logged')
  })).child({})
  child.silent('hello world')
})

test('changing level from info to silent and back to info', async (t) => {
  const expected = {
    level: 30,
    msg: 'hello world'
  }
  const stream = sink()
  const instance = pino({ level: 'info' }, stream)

  instance.level = 'silent'
  instance.info('hello world')
  let result = stream.read()
  t.assert.strictEqual(result, null)

  instance.level = 'info'
  instance.info('hello world')
  result = await once(stream, 'data')
  check(t.assert.strictEqual, result, expected.level, expected.msg)
})

test('changing level from info to silent and back to info in child logger', async (t) => {
  const expected = {
    level: 30,
    msg: 'hello world'
  }
  const stream = sink()
  const child = pino({ level: 'info' }, stream).child({})

  child.level = 'silent'
  child.info('hello world')
  let result = stream.read()
  t.assert.strictEqual(result, null)

  child.level = 'info'
  child.info('hello world')
  result = await once(stream, 'data')
  check(t.assert.strictEqual, result, expected.level, expected.msg)
})

describe('changing level respects level comparison set to', () => {
  const ascLevels = {
    debug: 1,
    info: 2,
    warn: 3
  }

  const descLevels = {
    debug: 3,
    info: 2,
    warn: 1
  }

  const expected = {
    level: 2,
    msg: 'hello world'
  }

  test('ASC in parent logger', async (t) => {
    const customLevels = ascLevels
    const levelComparison = 'ASC'

    const stream = sink()
    const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream)

    logger.level = 'warn'
    logger.info('hello world')
    let result = stream.read()
    t.assert.strictEqual(result, null)

    logger.level = 'debug'
    logger.info('hello world')
    result = await once(stream, 'data')
    check(t.assert.strictEqual, result, expected.level, expected.msg)
  })

  test('DESC in parent logger', async (t) => {
    const customLevels = descLevels
    const levelComparison = 'DESC'

    const stream = sink()
    const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream)

    logger.level = 'warn'
    logger.info('hello world')
    let result = stream.read()
    t.assert.strictEqual(result, null)

    logger.level = 'debug'
    logger.info('hello world')
    result = await once(stream, 'data')
    check(t.assert.strictEqual, result, expected.level, expected.msg)
  })

  test('custom function in parent logger', async (t) => {
    const customLevels = {
      info: 2,
      debug: 345,
      warn: 789
    }
    const levelComparison = (current, expected) => {
      if (expected === customLevels.warn) return false
      return true
    }

    const stream = sink()
    const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream)

    logger.level = 'warn'
    logger.info('hello world')
    let result = stream.read()
    t.assert.strictEqual(result, null)

    logger.level = 'debug'
    logger.info('hello world')
    result = await once(stream, 'data')
    check(t.assert.strictEqual, result, expected.level, expected.msg)
  })

  test('ASC in child logger', async (t) => {
    const customLevels = ascLevels
    const levelComparison = 'ASC'

    const stream = sink()
    const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream).child({ })

    logger.level = 'warn'
    logger.info('hello world')
    let result = stream.read()
    t.assert.strictEqual(result, null)

    logger.level = 'debug'
    logger.info('hello world')
    result = await once(stream, 'data')
    check(t.assert.strictEqual, result, expected.level, expected.msg)
  })

  test('DESC in parent logger', async (t) => {
    const customLevels = descLevels
    const levelComparison = 'DESC'

    const stream = sink()
    const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream).child({ })

    logger.level = 'warn'
    logger.info('hello world')
    let result = stream.read()
    t.assert.strictEqual(result, null)

    logger.level = 'debug'
    logger.info('hello world')
    result = await once(stream, 'data')
    check(t.assert.strictEqual, result, expected.level, expected.msg)
  })

  test('custom function in child logger', async (t) => {
    const customLevels = {
      info: 2,
      debug: 345,
      warn: 789
    }
    const levelComparison = (current, expected) => {
      if (expected === customLevels.warn) return false
      return true
    }

    const stream = sink()
    const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream).child({ })

    logger.level = 'warn'
    logger.info('hello world')
    let result = stream.read()
    t.assert.strictEqual(result, null)

    logger.level = 'debug'
    logger.info('hello world')
    result = await once(stream, 'data')
    check(t.assert.strictEqual, result, expected.level, expected.msg)
  })
})

test('changing level respects level comparison DESC', async (t) => {
  const customLevels = {
    warn: 1,
    info: 2,
    debug: 3
  }

  const levelComparison = 'DESC'

  const expected = {
    level: 2,
    msg: 'hello world'
  }

  const stream = sink()
  const logger = pino({ levelComparison, customLevels, useOnlyCustomLevels: true, level: 'info' }, stream)

  logger.level = 'warn'
  logger.info('hello world')
  let result = stream.read()
  t.assert.strictEqual(result, null)

  logger.level = 'debug'
  logger.info('hello world')
  result = await once(stream, 'data')
  check(t.assert.strictEqual, result, expected.level, expected.msg)
})

// testing for potential loss of Pino constructor scope from serializers - an edge case with circular refs see:  https://github.com/pinojs/pino/issues/833
test('trying to get levels when `this` is no longer a Pino instance returns an empty string', async (t) => {
  const notPinoInstance = { some: 'object', getLevel: levelsLib.getLevel }
  const blankedLevelValue = notPinoInstance.getLevel()
  t.assert.strictEqual(blankedLevelValue, '')
})

test('accepts capital letter for INFO level', async (t) => {
  const stream = sink()
  const logger = pino({
    level: 'INFO'
  }, stream)

  logger.info('test')
  const { level } = await once(stream, 'data')
  t.assert.strictEqual(level, 30)
})

test('accepts capital letter for FATAL level', async (t) => {
  const stream = sink()
  const logger = pino({
    level: 'FATAL'
  }, stream)

  logger.fatal('test')
  const { level } = await once(stream, 'data')
  t.assert.strictEqual(level, 60)
})

test('accepts capital letter for ERROR level', async (t) => {
  const stream = sink()
  const logger = pino({
    level: 'ERROR'
  }, stream)

  logger.error('test')
  const { level } = await once(stream, 'data')
  t.assert.strictEqual(level, 50)
})

test('accepts capital letter for WARN level', async (t) => {
  const stream = sink()
  const logger = pino({
    level: 'WARN'
  }, stream)

  logger.warn('test')
  const { level } = await once(stream, 'data')
  t.assert.strictEqual(level, 40)
})

test('accepts capital letter for DEBUG level', async (t) => {
  const stream = sink()
  const logger = pino({
    level: 'DEBUG'
  }, stream)

  logger.debug('test')
  const { level } = await once(stream, 'data')
  t.assert.strictEqual(level, 20)
})

test('accepts capital letter for TRACE level', async (t) => {
  const stream = sink()
  const logger = pino({
    level: 'TRACE'
  }, stream)

  logger.trace('test')
  const { level } = await once(stream, 'data')
  t.assert.strictEqual(level, 10)
})
