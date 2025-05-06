import { readFileSync } from 'node:fs'
import { hostname } from 'node:os'
import t from 'node:test'
import { destination, pino } from '../../pino.js'
import { check, file, once, sink, watchFileCreated } from '../helper.js'

t.test('named exports support', async (t) => {
  const stream = sink()
  const instance = pino(stream)
  instance.info('hello world')
  check(t.assert.strictEqual, await once(stream, 'data'), 30, 'hello world')
})

t.test('destination', async (t) => {
  const tmp = file()
  const instance = pino(destination(tmp))
  instance.info('hello')
  await watchFileCreated(tmp)
  const result = JSON.parse(readFileSync(tmp).toString())
  delete result.time
  t.assert.deepStrictEqual(result, {
    pid: process.pid,
    hostname: hostname(),
    level: 30,
    msg: 'hello'
  })
})
