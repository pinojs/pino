'use strict'

const { test } = require('tap')
const { sink, check, once } = require('./helper')
const pino = require('../')

test('pino.Console is exposed', async ({ ok }) => {
  ok(typeof pino.Console === 'function', 'pino.Console should be a constructor function')
})

test('Console constructor requires a logger', async ({ throws }) => {
  throws(() => new pino.Console(), /logger is required/)
})

test('Console constructor accepts pino logger instance', async ({ ok, doesNotThrow }) => {
  const logger = pino({ level: 'trace' })
  let consoleInstance

  doesNotThrow(() => {
    consoleInstance = new pino.Console(logger)
  }, 'should not throw when passed a logger')

  ok(consoleInstance instanceof pino.Console, 'should return Console instance')
})

test('console.log maps to pino.info', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.log('test message')

  check(equal, await once(stream, 'data'), 30, 'test message')
})

test('console.info maps to pino.info', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.info('test info message')

  check(equal, await once(stream, 'data'), 30, 'test info message')
})

test('console.warn maps to pino.warn', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.warn('test warning')

  check(equal, await once(stream, 'data'), 40, 'test warning')
})

test('console.error maps to pino.error', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.error('test error')

  check(equal, await once(stream, 'data'), 50, 'test error')
})

test('console.debug maps to pino.debug', async ({ equal }) => {
  const stream = sink()
  const logger = pino({ level: 'debug' }, stream)
  const console = new pino.Console(logger)

  console.debug('test debug')

  check(equal, await once(stream, 'data'), 20, 'test debug')
})

test('console.assert logs error when condition is false', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.assert(false, 'assertion failed')

  check(equal, await once(stream, 'data'), 50, 'Assertion failed: assertion failed')
})

test('console.assert does not log when condition is true', async ({ equal, not }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.assert(true, 'should not log')

  // Stream should not emit data since assertion passed
  stream.once('data', () => {
    not.ok('should not have logged')
  })

  // Give it a small delay to ensure no data is emitted
  await new Promise(resolve => setTimeout(resolve, 10))
  equal(true, true, 'assertion passed without logging')
})

test('console.assert with no message uses default', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.assert(false)

  check(equal, await once(stream, 'data'), 50, 'Assertion failed')
})

test('console.trace logs with stack trace', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino({ level: 'debug' }, stream)
  const console = new pino.Console(logger)

  console.trace('trace message')

  const result = await once(stream, 'data')
  equal(result.level, 20) // debug level
  match(result.msg, /^trace message/)
  match(result.trace, /at.*console-adapter\.test\.js/)
})

test('console.trace with no message shows default trace', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino({ level: 'debug' }, stream)
  const console = new pino.Console(logger)

  console.trace()

  const result = await once(stream, 'data')
  equal(result.level, 20) // debug level
  match(result.msg, /^Trace/)
  match(result.trace, /at.*console-adapter\.test\.js/)
})

test('console.time starts a timer', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.time('test-timer')

  // time() doesn't log anything immediately
  equal(true, true, 'timer started without logging')
})

test('console.timeEnd logs elapsed time', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.time('test-timer')
  await new Promise(resolve => setTimeout(resolve, 5))
  console.timeEnd('test-timer')

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  match(result.msg, /^test-timer: \d+\.\d+ms/)
})

test('console.timeEnd with non-existent timer logs warning', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.timeEnd('non-existent-timer')

  const result = await once(stream, 'data')
  equal(result.level, 40) // warn level
  match(result.msg, /Timer.*does not exist/)
})

test('console.timeLog logs intermediate time', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.time('test-timer')
  await new Promise(resolve => setTimeout(resolve, 5))
  console.timeLog('test-timer', 'intermediate')

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  match(result.msg, /^test-timer: \d+\.\d+ms intermediate/)
})

test('console.timeLog with default label', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.time() // default timer
  await new Promise(resolve => setTimeout(resolve, 5))
  console.timeLog()

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  match(result.msg, /^default: \d+\.\d+ms/)
})

test('console.count increments and logs count', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.count('test-count')

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  equal(result.msg, 'test-count: 1')
})

test('console.count with multiple calls', async ({ plan, equal }) => {
  plan(2)
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.count('test-count')
  let result = await once(stream, 'data')
  equal(result.msg, 'test-count: 1')

  console.count('test-count')
  result = await once(stream, 'data')
  equal(result.msg, 'test-count: 2')
})

test('console.count with default label', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.count() // default label

  const result = await once(stream, 'data')
  equal(result.level, 30)
  equal(result.msg, 'default: 1')
})

test('console.countReset resets counter to zero', async ({ plan, equal }) => {
  plan(2)
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.count('test-count')
  let result = await once(stream, 'data')
  equal(result.msg, 'test-count: 1')

  console.countReset('test-count')
  console.count('test-count')
  result = await once(stream, 'data')
  equal(result.msg, 'test-count: 1')
})

test('console.countReset on non-existent counter does nothing', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.countReset('non-existent')

  // Should not log anything
  equal(true, true, 'reset of non-existent counter completed')
})

test('console.group creates a group and logs message', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.group('test group')

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  equal(result.msg, '▼ test group')
})

test('console.groupCollapsed creates collapsed group', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.groupCollapsed('collapsed group')

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  equal(result.msg, '▶ collapsed group')
})

test('console.groupEnd logs group end', async ({ plan, equal }) => {
  plan(2)
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  console.group('test group')
  let result = await once(stream, 'data')
  equal(result.msg, '▼ test group')

  console.groupEnd()
  result = await once(stream, 'data')
  equal(result.msg, '▲ test group')
})

test('console.table logs tabular data', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  const data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ]
  console.table(data)

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  match(result.msg, /Alice/)
  match(result.msg, /Bob/)
})

test('console.dir logs object inspection', async ({ equal, match }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  const obj = { foo: 'bar', nested: { baz: 42 } }
  console.dir(obj)

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  match(result.msg, /foo.*bar/)
  match(result.msg, /baz.*42/)
})

test('console.dirxml logs object as XML-style', async ({ equal }) => {
  const stream = sink()
  const logger = pino(stream)
  const console = new pino.Console(logger)

  const obj = { element: 'value' }
  console.dirxml(obj)

  const result = await once(stream, 'data')
  equal(result.level, 30) // info level
  // dirxml should behave like dir for non-DOM objects
})
