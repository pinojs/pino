'use strict'

const { test } = require('tap')
const pino = require('../pino.js')

function is (received, expected, msg) {
  if (received.msg !== expected.msg) {
    throw new Error(`expected msg ${expected.msg} doesn't match the received one ${received.msg}`)
  }
}

test('pino.test.sink should pass', async ({ same }) => {
  const stream = pino.test.sink()
  stream.write('{"hello":"world"}\n')
  stream.write('{"hi":"world"}\n')
  stream.end()

  const expected = [
    { hello: 'world' },
    { hi: 'world' }
  ]

  let i = 0
  stream.on('data', (data) => {
    same(data, expected[i])
    i++
  })
})

test('pino.test.sink should pass with invalid json', async ({ doesNotThrow }) => {
  const stream = pino.test.sink()
  stream.write('helloworld')
  doesNotThrow(() => stream.end())
})

test('pino.test.sink should destroy stream with invalid json', async ({ emits }) => {
  const stream = pino.test.sink({ destroyOnError: true })
  stream.write('helloworld')
  stream.end()
  await emits(stream, 'close')
})

test('pino.test.sink should emit a stream error event with invalid json', async ({ match }) => {
  const stream = pino.test.sink({ emitErrorEvent: true })
  stream.write('helloworld')

  stream.on('error', (err) => {
    match(err.message, /Unexpected token/)
  })

  stream.end()
})

test('pino.test.sink should emit a stream error event and destroy the stream with invalid json', async ({ emits, match }) => {
  const stream = pino.test.sink({ destroyOnError: true, emitErrorEvent: true })
  stream.write('helloworld')

  stream.on('error', (err) => {
    match(err.message, /Unexpected token/)
  })

  stream.end()

  await emits(stream, 'close')
})

test('pino.test.once should pass', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected)
})

test('pino.test.once should pass with object', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info({ hello: 'world' })

  const expected = { hello: 'world', level: 30 }
  await pino.test.once(stream, expected)
})

test('pino.test.once should rejects with object', async ({ rejects }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info({ hello: 'world', hi: 'world' })

  const expected = { hello: 'world', level: 30 }

  rejects(
    pino.test.once(stream, expected),
    /Expected values to be strictly deep-equal:/
  )
})

test('pino.test.once should pass with own assert function', async ({ same }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected, same)
})

test('pino.test.once should rejects with assert diff error', async ({ rejects }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'by world', level: 30 }

  rejects(
    pino.test.once(stream, expected),
    /Expected values to be strictly deep-equal:/
  )
})

test('pino.test.once should rejects with assert diff error and own assert function', async ({ rejects }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'by world', level: 30 }

  rejects(
    pino.test.once(stream, expected, is),
    new Error('expected msg by world doesn\'t match the received one hello world')
  )
})

test('pino.test.consecutive should pass', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'hi world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected)
})

test('pino.test.consecutive should pass with object', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info({ hello: 'world' })
  instance.info({ hi: 'world' })

  const expected = [
    { hello: 'world', level: 30 },
    { hi: 'world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected)
})

test('pino.test.consecutive should rejects with object', async ({ rejects }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info({ hello: 'world' })
  instance.info({ hello: 'world', hi: 'world' })

  const expected = [
    { hello: 'world', level: 30 },
    { hi: 'world', level: 30 }
  ]

  rejects(
    pino.test.consecutive(stream, expected),
    /Expected values to be strictly deep-equal:/
  )
})

test('pino.test.consecutive should pass with own assert function', async ({ same }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'hi world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected, same)
})

test('pino.test.consecutive should rejects with assert diff error', async ({ rejects }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'by world', level: 30 }
  ]

  rejects(
    pino.test.consecutive(stream, expected),
    /Expected values to be strictly deep-equal:/
  )
})

test('pino.test.consecutive should rejects with assert diff error and own assert function', async ({ same, end, rejects }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'by world', level: 30 }
  ]

  rejects(
    pino.test.consecutive(stream, expected, is),
    new Error('expected msg by world doesn\'t match the received one hi world')
  )
})
