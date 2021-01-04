import t from 'tap'
import pino from '../../pino.js'
import helper from '../helper.js'

const { sink, check, once } = helper

t.test('esm support', async ({ is }) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info('hello world')
  check(is, await once(stream, 'data'), 30, 'hello world')
})
