'use strict'

const test = require('node:test')
const assert = require('node:assert')
const stdSerializers = require('pino-std-serializers')

const { sink, once } = require('./helper')
const pino = require('../')

const parentSerializers = {
  test: () => 'parent'
}

const childSerializers = {
  test: () => 'child'
}

test('default err namespace error serializer', async () => {
  const stream = sink()
  const parent = pino(stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  assert.equal(typeof o.err, 'object')
  assert.equal(o.err.type, 'ReferenceError')
  assert.equal(o.err.message, 'test')
  assert.equal(typeof o.err.stack, 'string')
})

test('custom serializer overrides default err namespace error serializer', async () => {
  const stream = sink()
  const parent = pino({
    serializers: {
      err: (e) => ({
        t: e.constructor.name,
        m: e.message,
        s: e.stack
      })
    }
  }, stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  assert.equal(typeof o.err, 'object')
  assert.equal(o.err.t, 'ReferenceError')
  assert.equal(o.err.m, 'test')
  assert.equal(typeof o.err.s, 'string')
})

test('custom serializer overrides default err namespace error serializer when nestedKey is on', async () => {
  const stream = sink()
  const parent = pino({
    nestedKey: 'obj',
    serializers: {
      err: (e) => {
        return {
          t: e.constructor.name,
          m: e.message,
          s: e.stack
        }
      }
    }
  }, stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  assert.equal(typeof o.obj.err, 'object')
  assert.equal(o.obj.err.t, 'ReferenceError')
  assert.equal(o.obj.err.m, 'test')
  assert.equal(typeof o.obj.err.s, 'string')
})

test('null overrides default err namespace error serializer', async () => {
  const stream = sink()
  const parent = pino({ serializers: { err: null } }, stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  assert.equal(typeof o.err, 'object')
  assert.equal(typeof o.err.type, 'undefined')
  assert.equal(typeof o.err.message, 'undefined')
  assert.equal(typeof o.err.stack, 'undefined')
})

test('undefined overrides default err namespace error serializer', async () => {
  const stream = sink()
  const parent = pino({ serializers: { err: undefined } }, stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  assert.equal(typeof o.err, 'object')
  assert.equal(typeof o.err.type, 'undefined')
  assert.equal(typeof o.err.message, 'undefined')
  assert.equal(typeof o.err.stack, 'undefined')
})

test('serializers override values', async () => {
  const stream = sink()
  const parent = pino({ serializers: parentSerializers }, stream)
  parent.child({}, { serializers: childSerializers })

  parent.fatal({ test: 'test' })
  const o = await once(stream, 'data')
  assert.equal(o.test, 'parent')
})

test('child does not overwrite parent serializers', async () => {
  const stream = sink()
  const parent = pino({ serializers: parentSerializers }, stream)
  const child = parent.child({}, { serializers: childSerializers })

  parent.fatal({ test: 'test' })

  const o = once(stream, 'data')
  assert.equal((await o).test, 'parent')
  const o2 = once(stream, 'data')
  child.fatal({ test: 'test' })
  assert.equal((await o2).test, 'child')
})

test('Symbol.for(\'pino.serializers\')', async () => {
  const stream = sink()
  const expected = Object.assign({
    err: stdSerializers.err
  }, parentSerializers)
  const parent = pino({ serializers: parentSerializers }, stream)
  const child = parent.child({ a: 'property' })

  assert.deepEqual(parent[Symbol.for('pino.serializers')], expected)
  assert.deepEqual(child[Symbol.for('pino.serializers')], expected)
  assert.equal(parent[Symbol.for('pino.serializers')], child[Symbol.for('pino.serializers')])

  const child2 = parent.child({}, {
    serializers: {
      a
    }
  })

  function a () {
    return 'hello'
  }

  // eslint-disable-next-line eqeqeq
  assert.equal(child2[Symbol.for('pino.serializers')] != parentSerializers, true)
  assert.equal(child2[Symbol.for('pino.serializers')].a, a)
  assert.equal(child2[Symbol.for('pino.serializers')].test, parentSerializers.test)
})

test('children inherit parent serializers', async () => {
  const stream = sink()
  const parent = pino({ serializers: parentSerializers }, stream)

  const child = parent.child({ a: 'property' })
  child.fatal({ test: 'test' })
  const o = await once(stream, 'data')
  assert.equal(o.test, 'parent')
})

test('children inherit parent Symbol serializers', async () => {
  const stream = sink()
  const symbolSerializers = {
    [Symbol.for('b')]: b
  }
  const expected = Object.assign({
    err: stdSerializers.err
  }, symbolSerializers)
  const parent = pino({ serializers: symbolSerializers }, stream)

  assert.deepEqual(parent[Symbol.for('pino.serializers')], expected)

  const child = parent.child({}, {
    serializers: {
      [Symbol.for('a')]: a,
      a
    }
  })

  function a () {
    return 'hello'
  }

  function b () {
    return 'world'
  }

  assert.deepEqual(child[Symbol.for('pino.serializers')].a, a)
  assert.deepEqual(child[Symbol.for('pino.serializers')][Symbol.for('b')], b)
  assert.deepEqual(child[Symbol.for('pino.serializers')][Symbol.for('a')], a)
})

test('children serializers get called', async () => {
  const stream = sink()
  const parent = pino({
    test: 'this'
  }, stream)

  const child = parent.child({ a: 'property' }, { serializers: childSerializers })

  child.fatal({ test: 'test' })
  const o = await once(stream, 'data')
  assert.equal(o.test, 'child')
})

test('children serializers get called when inherited from parent', async () => {
  const stream = sink()
  const parent = pino({
    test: 'this',
    serializers: parentSerializers
  }, stream)

  const child = parent.child({}, { serializers: { test: function () { return 'pass' } } })

  child.fatal({ test: 'fail' })
  const o = await once(stream, 'data')
  assert.equal(o.test, 'pass')
})

test('non-overridden serializers are available in the children', async () => {
  const stream = sink()
  const pSerializers = {
    onlyParent: function () { return 'parent' },
    shared: function () { return 'parent' }
  }

  const cSerializers = {
    shared: function () { return 'child' },
    onlyChild: function () { return 'child' }
  }

  const parent = pino({ serializers: pSerializers }, stream)

  const child = parent.child({}, { serializers: cSerializers })

  const o = once(stream, 'data')
  child.fatal({ shared: 'test' })
  assert.equal((await o).shared, 'child')
  const o2 = once(stream, 'data')
  child.fatal({ onlyParent: 'test' })
  assert.equal((await o2).onlyParent, 'parent')
  const o3 = once(stream, 'data')
  child.fatal({ onlyChild: 'test' })
  assert.equal((await o3).onlyChild, 'child')
  const o4 = once(stream, 'data')
  parent.fatal({ onlyChild: 'test' })
  assert.equal((await o4).onlyChild, 'test')
})

test('custom serializer for messageKey', async () => {
  const stream = sink()
  const instance = pino({ serializers: { msg: () => '422' } }, stream)

  const o = { num: NaN }
  instance.info(o, 42)

  const { msg } = await once(stream, 'data')
  assert.equal(msg, '422')
})
