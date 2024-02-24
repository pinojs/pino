'use strict'

const { test } = require('tap')
const pino = require('../pino.js')

test('pino.test.sink', async ({ same }) => {
  const stream = pino.test.sink()
  stream.write('{"hello":"world"}\n')
  stream.write('{"test":"test"}\n')
  stream.end()

  const expected = [
    { hello: 'world' },
    { test: 'test' }
  ]

  let i = 0
  stream.on('data', (data) => {
    same(data, expected[i])
    i++
  })
})

test('pino.test.sink json parse error', async ({ doesNotThrow }) => {
  const stream = pino.test.sink()
  doesNotThrow(() => stream.write('helloworld'))
  stream.end()
})

test('pino.test.once', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected)
})

test('pino.test.once with own assert function', async ({ same }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected, same)
})

test('pino.test.consecutive', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('test')
  instance.info('hello world')

  const expected = [
    { msg: 'test', level: 30 },
    { msg: 'hello world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected)
})

test('pino.test.consecutive with own assert function', async ({ same }) => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('test')
  instance.info('hello world')

  const expected = [
    { msg: 'test', level: 30 },
    { msg: 'hello world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected, same)
})
