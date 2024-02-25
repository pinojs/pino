/* global test */
const pino = require('../../pino')

function is (received, expected, msg) {
  // eslint-disable-next-line no-undef
  expect(received).toStrictEqual(expected)
}

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

test('pino.test.once should rejects with object', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info({ hello: 'world', hi: 'world' })

  const expected = { hello: 'world', level: 30 }

  // eslint-disable-next-line no-undef
  expect(() => pino.test.once(stream, expected)).rejects.toThrow()
})

test('pino.test.once should pass with own assert function', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected, is)
})

test('pino.test.once should rejects with assert diff error', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'by world', level: 30 }

  // eslint-disable-next-line no-undef
  expect(() => pino.test.once(stream, expected)).rejects.toThrow()
})

test('pino.test.once should rejects with assert diff error and own assert function', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'by world', level: 30 }

  // eslint-disable-next-line no-undef
  expect(() => pino.test.once(stream, expected, is)).rejects.toThrow()
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

test('pino.test.consecutive should rejects with object', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info({ hello: 'world' })
  instance.info({ hello: 'world', hi: 'world' })

  const expected = [
    { hello: 'world', level: 30 },
    { hi: 'world', level: 30 }
  ]

  // eslint-disable-next-line no-undef
  expect(() => pino.test.consecutive(stream, expected)).rejects.toThrow()
})

test('pino.test.consecutive should pass with own assert function', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'hi world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected, is)
})

test('pino.test.consecutive should rejects with assert diff error', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'by world', level: 30 }
  ]

  // eslint-disable-next-line no-undef
  expect(() => pino.test.consecutive(stream, expected)).rejects.toThrow()
})

test('pino.test.consecutive should rejects with assert diff error and own assert function', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')
  instance.info('hi world')

  const expected = [
    { msg: 'hello world', level: 30 },
    { msg: 'by world', level: 30 }
  ]

  // eslint-disable-next-line no-undef
  expect(() => pino.test.consecutive(stream, expected, is)).rejects.toThrow()
})
