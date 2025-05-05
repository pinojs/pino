'use strict'

const { test } = require('node:test')
const { sink, once } = require('./helper')
const pino = require('../')

const level = 50
const name = 'error'

test('default merge strategy', async (t) => {
  const stream = sink()
  const instance = pino({
    base: {},
    mixin () {
      return { tag: 'k8s' }
    }
  }, stream)
  instance.level = name
  instance[name]({
    tag: 'local'
  }, 'test')
  const result = await once(stream, 'data')
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  t.assert.deepStrictEqual(result, {
    level,
    msg: 'test',
    tag: 'local'
  })
})

test('custom merge strategy with mixin priority', async (t) => {
  const stream = sink()
  const instance = pino({
    base: {},
    mixin () {
      return { tag: 'k8s' }
    },
    mixinMergeStrategy (mergeObject, mixinObject) {
      return Object.assign(mergeObject, mixinObject)
    }
  }, stream)
  instance.level = name
  instance[name]({
    tag: 'local'
  }, 'test')
  const result = await once(stream, 'data')
  t.assert.ok(new Date(result.time) <= new Date(), 'time is greater than Date.now()')
  delete result.time
  t.assert.deepStrictEqual(result, {
    level,
    msg: 'test',
    tag: 'k8s'
  })
})
