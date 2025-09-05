const test = require('brittle')
const { Transform } = require('bare-stream')
const pino = require('../')

test('basic', (t) => {
  t.plan(3)

  const stream = new Transform()
  const instance = pino(stream)
  const child = instance.child({ a: 'property' })

  child.info('hello world')

  stream.once('data', (data) => {
    data = JSON.parse(data.toString())

    t.is(data.msg, 'hello world')
    t.is(data.level, 30)
    t.is(data.a, 'property')
  })
})
