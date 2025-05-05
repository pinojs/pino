import t from 'node:test'
import pino from '../../pino.js'
import helper from '../helper.js'

const { sink, check, once } = helper

t.test('esm support', async (t) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info('hello world')
  check(t.assert.strictEqual, await once(stream, 'data'), 30, 'hello world')
})
