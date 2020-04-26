'use strict'
const os = require('os')
const { join } = require('path')
const { readFileSync, existsSync, statSync } = require('fs')
const { test } = require('tap')
const { sink, check, once } = require('./helper')
const pino = require('../')
const { version } = require('../package.json')
const { pid } = process
const hostname = os.hostname()
const watchFileCreated = (filename) => new Promise((resolve, reject) => {
  const TIMEOUT = 800
  const INTERVAL = 100
  const threshold = TIMEOUT / INTERVAL
  let counter = 0
  const interval = setInterval(() => {
    // On some CI runs file is created but not filled
    if (existsSync(filename) && statSync(filename).size !== 0) {
      clearInterval(interval)
      resolve()
    } else if (counter <= threshold) {
      counter++
    } else {
      clearInterval(interval)
      reject(new Error(`${filename} was not created.`))
    }
  }, INTERVAL)
})

test('pino version is exposed on export', async ({ is }) => {
  is(pino.version, version)
})

test('pino version is exposed on instance', async ({ is }) => {
  const instance = pino()
  is(instance.version, version)
})

test('child instance exposes pino version', async ({ is }) => {
  const child = pino().child({ foo: 'bar' })
  is(child.version, version)
})

test('bindings are exposed on every instance', async ({ same }) => {
  const instance = pino()
  same(instance.bindings(), {})
})

test('bindings contain the name and the child bindings', async ({ same }) => {
  const instance = pino({ name: 'basicTest', level: 'info' }).child({ foo: 'bar' }).child({ a: 2 })
  same(instance.bindings(), { name: 'basicTest', foo: 'bar', a: 2 })
})

test('set bindings on instance', async ({ same }) => {
  const instance = pino({ name: 'basicTest', level: 'info' })
  instance.setBindings({ foo: 'bar' })
  same(instance.bindings(), { name: 'basicTest', foo: 'bar' })
})

test('newly set bindings overwrite old bindings', async ({ same }) => {
  const instance = pino({ name: 'basicTest', level: 'info', base: { foo: 'bar' } })
  instance.setBindings({ foo: 'baz' })
  same(instance.bindings(), { name: 'basicTest', foo: 'baz' })
})

test('set bindings on child instance', async ({ same }) => {
  const child = pino({ name: 'basicTest', level: 'info' }).child({})
  child.setBindings({ foo: 'bar' })
  same(child.bindings(), { name: 'basicTest', foo: 'bar' })
})

test('child should have bindings set by parent', async ({ same }) => {
  const instance = pino({ name: 'basicTest', level: 'info' })
  instance.setBindings({ foo: 'bar' })
  const child = instance.child({})
  same(child.bindings(), { name: 'basicTest', foo: 'bar' })
})

test('child should not share bindings of parent set after child creation', async ({ same }) => {
  const instance = pino({ name: 'basicTest', level: 'info' })
  const child = instance.child({})
  instance.setBindings({ foo: 'bar' })
  same(instance.bindings(), { name: 'basicTest', foo: 'bar' })
  same(child.bindings(), { name: 'basicTest' })
})

function levelTest (name, level) {
  test(`${name} logs as ${level}`, async ({ is }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name
    instance[name]('hello world')
    check(is, await once(stream, 'data'), level, 'hello world')
  })

  test(`passing objects at level ${name}`, async ({ is, same }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name
    const obj = { hello: 'world' }
    instance[name](obj)

    const result = await once(stream, 'data')
    is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
    is(result.pid, pid)
    is(result.hostname, hostname)
    is(result.level, level)
    is(result.hello, 'world')
    same(Object.keys(obj), ['hello'])
  })

  test(`passing an object and a string at level ${name}`, async ({ is, same }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name
    const obj = { hello: 'world' }
    instance[name](obj, 'a string')
    const result = await once(stream, 'data')
    is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
    delete result.time
    same(result, {
      pid,
      hostname,
      level,
      msg: 'a string',
      hello: 'world'
    })
    same(Object.keys(obj), ['hello'])
  })

  test(`overriding object key by string at level ${name}`, async ({ is, same }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name
    instance[name]({ hello: 'world', msg: 'object' }, 'string')
    const result = await once(stream, 'data')
    is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
    delete result.time
    same(result, {
      pid,
      hostname,
      level,
      msg: 'string',
      hello: 'world'
    })
  })

  test(`formatting logs as ${name}`, async ({ is }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name
    instance[name]('hello %d', 42)
    const result = await once(stream, 'data')
    check(is, result, level, 'hello 42')
  })

  test(`formatting a symbol at level ${name}`, async ({ is }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name

    const sym = Symbol('foo')
    instance[name]('hello %s', sym)

    const result = await once(stream, 'data')

    check(is, result, level, 'hello Symbol(foo)')
  })

  test(`passing error with a serializer at level ${name}`, async ({ is, same }) => {
    const stream = sink()
    const err = new Error('myerror')
    const instance = pino({
      serializers: {
        err: pino.stdSerializers.err
      }
    }, stream)
    instance.level = name
    instance[name]({ err })
    const result = await once(stream, 'data')
    is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
    delete result.time
    same(result, {
      pid,
      hostname,
      level,
      err: {
        type: 'Error',
        message: err.message,
        stack: err.stack
      }
    })
  })

  test(`child logger for level ${name}`, async ({ is, same }) => {
    const stream = sink()
    const instance = pino(stream)
    instance.level = name
    const child = instance.child({ hello: 'world' })
    child[name]('hello world')
    const result = await once(stream, 'data')
    is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
    delete result.time
    same(result, {
      pid,
      hostname,
      level,
      msg: 'hello world',
      hello: 'world'
    })
  })
}

levelTest('fatal', 60)
levelTest('error', 50)
levelTest('warn', 40)
levelTest('info', 30)
levelTest('debug', 20)
levelTest('trace', 10)

test('serializers can return undefined to strip field', async ({ is }) => {
  const stream = sink()
  const instance = pino({
    serializers: {
      test () { return undefined }
    }
  }, stream)

  instance.info({ test: 'sensitive info' })
  const result = await once(stream, 'data')
  is('test' in result, false)
})

test('does not explode with a circular ref', async ({ doesNotThrow }) => {
  const stream = sink()
  const instance = pino(stream)
  const b = {}
  const a = {
    hello: b
  }
  b.a = a // circular ref
  doesNotThrow(() => instance.info(a))
})

test('set the name', async ({ is, same }) => {
  const stream = sink()
  const instance = pino({
    name: 'hello'
  }, stream)
  instance.fatal('this is fatal')
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 60,
    name: 'hello',
    msg: 'this is fatal'
  })
})

test('set the messageKey', async ({ is, same }) => {
  const stream = sink()
  const message = 'hello world'
  const messageKey = 'fooMessage'
  const instance = pino({
    messageKey
  }, stream)
  instance.info(message)
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    fooMessage: message
  })
})

test('set the nestedKey', async ({ is, same }) => {
  const stream = sink()
  const object = { hello: 'world' }
  const nestedKey = 'stuff'
  const instance = pino({
    nestedKey
  }, stream)
  instance.info(object)
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    stuff: object
  })
})

test('set undefined properties', async ({ is, same }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info({ hello: 'world', property: undefined })
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    hello: 'world'
  })
})

test('prototype properties are not logged', async ({ is }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info(Object.create({ hello: 'world' }))
  const { hello } = await once(stream, 'data')
  is(hello, undefined)
})

test('set the base', async ({ is, same }) => {
  const stream = sink()
  const instance = pino({
    base: {
      a: 'b'
    }
  }, stream)

  instance.fatal('this is fatal')
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    a: 'b',
    level: 60,
    msg: 'this is fatal'
  })
})

test('set the base to null', async ({ is, same }) => {
  const stream = sink()
  const instance = pino({
    base: null
  }, stream)
  instance.fatal('this is fatal')
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    level: 60,
    msg: 'this is fatal'
  })
})

test('set the base to null and use a formatter', async ({ is, same }) => {
  const stream = sink()
  const instance = pino({
    base: null,
    formatters: {
      log (input) {
        return Object.assign({}, input, { additionalMessage: 'using pino' })
      }
    }
  }, stream)
  instance.fatal('this is fatal too')
  const result = await once(stream, 'data')
  is(new Date(result.time) <= new Date(), true, 'time is greater than Date.now()')
  delete result.time
  same(result, {
    level: 60,
    msg: 'this is fatal too',
    additionalMessage: 'using pino'
  })
})

test('throw if creating child without bindings', async ({ is, fail }) => {
  const stream = sink()
  const instance = pino(stream)
  try {
    instance.child()
    fail('it should throw')
  } catch (err) {
    is(err.message, 'missing bindings for child Pino')
  }
})

test('correctly escapes msg strings with stray double quote at end', async ({ same }) => {
  const stream = sink()
  const instance = pino({
    name: 'hello'
  }, stream)

  instance.fatal('this contains "')
  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 60,
    name: 'hello',
    msg: 'this contains "'
  })
})

test('correctly escape msg strings with unclosed double quote', async ({ same }) => {
  const stream = sink()
  const instance = pino({
    name: 'hello'
  }, stream)
  instance.fatal('" this contains')
  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 60,
    name: 'hello',
    msg: '" this contains'
  })
})

// https://github.com/pinojs/pino/issues/139
test('object and format string', async ({ same }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info({}, 'foo %s', 'bar')

  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'foo bar'
  })
})

test('object and format string property', async ({ same }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info({ answer: 42 }, 'foo %s', 'bar')
  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'foo bar',
    answer: 42
  })
})

test('correctly strip undefined when returned from toJSON', async ({ is }) => {
  const stream = sink()
  const instance = pino({
    test: 'this'
  }, stream)
  instance.fatal({ test: { toJSON () { return undefined } } })
  const result = await once(stream, 'data')
  is('test' in result, false)
})

test('correctly supports stderr', async ({ same }) => {
  // stderr inherits from Stream, rather than Writable
  const dest = {
    writable: true,
    write (result) {
      result = JSON.parse(result)
      delete result.time
      same(result, {
        pid,
        hostname,
        level: 60,
        msg: 'a message'
      })
    }
  }
  const instance = pino(dest)
  instance.fatal('a message')
})

test('normalize number to string', async ({ same }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info(1)
  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: '1'
  })
})

test('normalize number to string with an object', async ({ same }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info({ answer: 42 }, 1)
  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: '1',
    answer: 42
  })
})

test('handles objects with null prototype', async ({ same }) => {
  const stream = sink()
  const instance = pino(stream)
  const o = Object.create(null)
  o.test = 'test'
  instance.info(o)
  const result = await once(stream, 'data')
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    test: 'test'
  })
})

test('pino.destination', async ({ same }) => {
  const tmp = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(pino.destination(tmp))
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('auto pino.destination with a string', async ({ same }) => {
  const tmp = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(tmp)
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('auto pino.destination with a string as second argument', async ({ same }) => {
  const tmp = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino(null, tmp)
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('does not override opts with a string as second argument', async ({ same }) => {
  const tmp = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const instance = pino({
    timestamp: () => ',"time":"none"'
  }, tmp)
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  same(result, {
    pid,
    hostname,
    level: 30,
    time: 'none',
    msg: 'hello'
  })
})

// https://github.com/pinojs/pino/issues/222
test('children with same names render in correct order', async ({ is }) => {
  const stream = sink()
  const root = pino(stream)
  root.child({ a: 1 }).child({ a: 2 }).info({ a: 3 })
  const { a } = await once(stream, 'data')
  is(a, 3, 'last logged object takes precedence')
})

// https://github.com/pinojs/pino/pull/251 - use this.stringify
test('use `fast-safe-stringify` to avoid circular dependencies', async ({ deepEqual }) => {
  const stream = sink()
  const root = pino(stream)
  // circular depth
  const obj = {}
  obj.a = obj
  root.info(obj)
  const { a } = await once(stream, 'data')
  deepEqual(a, { a: '[Circular]' })
})

test('fast-safe-stringify must be used when interpolating', async (t) => {
  const stream = sink()
  const instance = pino(stream)

  const o = { a: { b: {} } }
  o.a.b.c = o.a.b
  instance.info('test %j', o)

  const { msg } = await once(stream, 'data')
  t.is(msg, 'test {"a":{"b":{"c":"[Circular]"}}}')
})

test('throws when setting useOnlyCustomLevels without customLevels', async ({ is, throws }) => {
  throws(() => {
    pino({
      useOnlyCustomLevels: true
    })
  })
  try {
    pino({
      useOnlyCustomLevels: true
    })
  } catch ({ message }) {
    is(message, 'customLevels is required if useOnlyCustomLevels is set true')
  }
})

test('correctly log Infinity', async (t) => {
  const stream = sink()
  const instance = pino(stream)

  const o = { num: Infinity }
  instance.info(o)

  const { num } = await once(stream, 'data')
  t.is(num, null)
})

test('correctly log -Infinity', async (t) => {
  const stream = sink()
  const instance = pino(stream)

  const o = { num: -Infinity }
  instance.info(o)

  const { num } = await once(stream, 'data')
  t.is(num, null)
})

test('correctly log NaN', async (t) => {
  const stream = sink()
  const instance = pino(stream)

  const o = { num: NaN }
  instance.info(o)

  const { num } = await once(stream, 'data')
  t.is(num, null)
})
