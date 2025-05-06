'use strict'
const { test } = require('node:test')
const { sink, once } = require('./helper')
const stdSerializers = require('pino-std-serializers')
const pino = require('../')

const parentSerializers = {
  test: () => 'parent'
}

const childSerializers = {
  test: () => 'child'
}

test('default err namespace error serializer', async (t) => {
  const stream = sink()
  const parent = pino(stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  t.assert.strictEqual(typeof o.err, 'object')
  t.assert.strictEqual(o.err.type, 'ReferenceError')
  t.assert.strictEqual(o.err.message, 'test')
  t.assert.strictEqual(typeof o.err.stack, 'string')
})

test('custom serializer overrides default err namespace error serializer', async (t) => {
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
  t.assert.strictEqual(typeof o.err, 'object')
  t.assert.strictEqual(o.err.t, 'ReferenceError')
  t.assert.strictEqual(o.err.m, 'test')
  t.assert.strictEqual(typeof o.err.s, 'string')
})

test('custom serializer overrides default err namespace error serializer when nestedKey is on', async (t) => {
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
  t.assert.strictEqual(typeof o.obj.err, 'object')
  t.assert.strictEqual(o.obj.err.t, 'ReferenceError')
  t.assert.strictEqual(o.obj.err.m, 'test')
  t.assert.strictEqual(typeof o.obj.err.s, 'string')
})

test('null overrides default err namespace error serializer', async (t) => {
  const stream = sink()
  const parent = pino({ serializers: { err: null } }, stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  t.assert.strictEqual(typeof o.err, 'object')
  t.assert.strictEqual(typeof o.err.type, 'undefined')
  t.assert.strictEqual(typeof o.err.message, 'undefined')
  t.assert.strictEqual(typeof o.err.stack, 'undefined')
})

test('undefined overrides default err namespace error serializer', async (t) => {
  const stream = sink()
  const parent = pino({ serializers: { err: undefined } }, stream)

  parent.info({ err: ReferenceError('test') })
  const o = await once(stream, 'data')
  t.assert.strictEqual(typeof o.err, 'object')
  t.assert.strictEqual(typeof o.err.type, 'undefined')
  t.assert.strictEqual(typeof o.err.message, 'undefined')
  t.assert.strictEqual(typeof o.err.stack, 'undefined')
})

test('serializers override values', async (t) => {
  const stream = sink()
  const parent = pino({ serializers: parentSerializers }, stream)
  parent.child({}, { serializers: childSerializers })

  parent.fatal({ test: 'test' })
  const o = await once(stream, 'data')
  t.assert.strictEqual(o.test, 'parent')
})

test('child does not overwrite parent serializers', async (t) => {
  const stream = sink()
  const parent = pino({ serializers: parentSerializers }, stream)
  const child = parent.child({}, { serializers: childSerializers })

  parent.fatal({ test: 'test' })

  const o = once(stream, 'data')
  t.assert.strictEqual((await o).test, 'parent')
  const o2 = once(stream, 'data')
  child.fatal({ test: 'test' })
  t.assert.strictEqual((await o2).test, 'child')
})

test('Symbol.for(\'pino.serializers\')', async (t) => {
  const stream = sink()
  const expected = Object.assign({
    err: stdSerializers.err
  }, parentSerializers)
  const parent = pino({ serializers: parentSerializers }, stream)
  const child = parent.child({ a: 'property' })

  t.assert.deepStrictEqual(parent[Symbol.for('pino.serializers')], expected)
  t.assert.deepStrictEqual(child[Symbol.for('pino.serializers')], expected)
  t.assert.strictEqual(parent[Symbol.for('pino.serializers')], child[Symbol.for('pino.serializers')])

  const child2 = parent.child({}, {
    serializers: {
      a
    }
  })

  function a () {
    return 'hello'
  }

  t.assert.notStrictEqual(child2[Symbol.for('pino.serializers')], parentSerializers)
  t.assert.strictEqual(child2[Symbol.for('pino.serializers')].a, a)
  t.assert.strictEqual(child2[Symbol.for('pino.serializers')].test, parentSerializers.test)
})

test('children inherit parent serializers', async (t) => {
  const stream = sink()
  const parent = pino({ serializers: parentSerializers }, stream)

  const child = parent.child({ a: 'property' })
  child.fatal({ test: 'test' })
  const o = await once(stream, 'data')
  t.assert.strictEqual(o.test, 'parent')
})

test('children inherit parent Symbol serializers', async (t) => {
  const stream = sink()
  const symbolSerializers = {
    [Symbol.for('b')]: b
  }
  const expected = Object.assign({
    err: stdSerializers.err
  }, symbolSerializers)
  const parent = pino({ serializers: symbolSerializers }, stream)

  t.assert.deepStrictEqual(parent[Symbol.for('pino.serializers')], expected)

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

  t.assert.strictEqual(child[Symbol.for('pino.serializers')].a, a)
  t.assert.strictEqual(child[Symbol.for('pino.serializers')][Symbol.for('b')], b)
  t.assert.strictEqual(child[Symbol.for('pino.serializers')][Symbol.for('a')], a)
})

test('children serializers get called', async (t) => {
  const stream = sink()
  const parent = pino({
    test: 'this'
  }, stream)

  const child = parent.child({ a: 'property' }, { serializers: childSerializers })

  child.fatal({ test: 'test' })
  const o = await once(stream, 'data')
  t.assert.strictEqual(o.test, 'child')
})

test('children serializers get called when inherited from parent', async (t) => {
  const stream = sink()
  const parent = pino({
    test: 'this',
    serializers: parentSerializers
  }, stream)

  const child = parent.child({}, { serializers: { test: function () { return 'pass' } } })

  child.fatal({ test: 'fail' })
  const o = await once(stream, 'data')
  t.assert.strictEqual(o.test, 'pass')
})

test('non-overridden serializers are available in the children', async (t) => {
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
  t.assert.strictEqual((await o).shared, 'child')
  const o2 = once(stream, 'data')
  child.fatal({ onlyParent: 'test' })
  t.assert.strictEqual((await o2).onlyParent, 'parent')
  const o3 = once(stream, 'data')
  child.fatal({ onlyChild: 'test' })
  t.assert.strictEqual((await o3).onlyChild, 'child')
  const o4 = once(stream, 'data')
  parent.fatal({ onlyChild: 'test' })
  t.assert.strictEqual((await o4).onlyChild, 'test')
})

test('custom serializer for messageKey', async (t) => {
  const stream = sink()
  const instance = pino({ serializers: { msg: () => '422' } }, stream)

  const o = { num: NaN }
  instance.info(o, 42)

  const { msg } = await once(stream, 'data')
  t.assert.strictEqual(msg, '422')
})
