/* global test */
const pino = require('../../pino')

function is (received, expected, msg) {
  // eslint-disable-next-line no-undef
  expect(received).toStrictEqual(expected)
}

test('pino.test.once', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected)
})

test('pino.test.once with own assert function', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('hello world')

  const expected = { msg: 'hello world', level: 30 }
  await pino.test.once(stream, expected, is)
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

test('pino.test.consecutive with own assert function', async () => {
  const stream = pino.test.sink()
  const instance = pino(stream)

  instance.info('test')
  instance.info('hello world')

  const expected = [
    { msg: 'test', level: 30 },
    { msg: 'hello world', level: 30 }
  ]
  await pino.test.consecutive(stream, expected, is)
})
