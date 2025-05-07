'use strict'
const { test } = require('node:test')
const { sink, once } = require('./helper')
const stdSerializers = require('pino-std-serializers')
const pino = require('../')

test('set the errorKey with error serializer', async (t) => {
  const stream = sink()
  const errorKey = 'error'
  const instance = pino({
    errorKey,
    serializers: { [errorKey]: stdSerializers.err }
  }, stream)
  instance.error(new ReferenceError('test'))
  const o = await once(stream, 'data')
  t.assert.strictEqual(typeof o[errorKey], 'object')
  t.assert.strictEqual(o[errorKey].type, 'ReferenceError')
  t.assert.strictEqual(o[errorKey].message, 'test')
  t.assert.strictEqual(typeof o[errorKey].stack, 'string')
})

test('set the errorKey without error serializer', async (t) => {
  const stream = sink()
  const errorKey = 'error'
  const instance = pino({
    errorKey
  }, stream)
  instance.error(new ReferenceError('test'))
  const o = await once(stream, 'data')
  t.assert.strictEqual(typeof o[errorKey], 'object')
  t.assert.strictEqual(o[errorKey].type, 'ReferenceError')
  t.assert.strictEqual(o[errorKey].message, 'test')
  t.assert.strictEqual(typeof o[errorKey].stack, 'string')
})
