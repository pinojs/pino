'use strict'

const { test } = require('tap')
const { sink } = require('./helper')
const { check } = require('./helper')
const pino = require('../')

test('set the level by string', async ({is}) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const instance = pino(sink((chunk, enc, cb) => {
    const current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('the wrong level throws', async ({throws}) => {
  const instance = pino()
  throws(() => {
    instance.level = 'kaboom'
  })
})

test('set the level by number', async ({is}) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const instance = pino(sink((chunk, enc, cb) => {
    const current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.levelVal = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('set the level by number via string method', async ({is}) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const instance = pino(sink((chunk, enc, cb) => {
    const current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.level = 50
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('exposes level string mappings', async ({is}) => {
  is(pino.levels.values.error, 50)
})

test('exposes level number mappings', async ({is}) => {
  is(pino.levels.labels[50], 'error')
})

test('returns level integer', async ({is}) => {
  const instance = pino({ level: 'error' })
  is(instance.levelVal, 50)
})

test('child returns level integer', async ({is}) => {
  const parent = pino({ level: 'error' })
  const child = parent.child({ foo: 'bar' })
  is(child.levelVal, 50)
})

test('set the level via constructor', async ({is}) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const instance = pino({ level: 'error' }, sink((chunk, enc, cb) => {
    const current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  }))

  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})

test('level-change event', async ({is}) => {
  const instance = pino()
  function handle (lvl, val, prevLvl, prevVal) {
    is(lvl, 'trace')
    is(val, 10)
    is(prevLvl, 'info')
    is(prevVal, 30)
  }
  instance.on('level-change', handle)
  instance.level = 'trace'
  instance.removeListener('level-change', handle)
  instance.level = 'info'

  var count = 0

  const l1 = () => count++
  const l2 = () => count++
  const l3 = () => count++
  instance.on('level-change', l1)
  instance.on('level-change', l2)
  instance.on('level-change', l3)

  instance.level = 'trace'
  instance.removeListener('level-change', l3)
  instance.level = 'fatal'
  instance.removeListener('level-change', l1)
  instance.level = 'debug'
  instance.removeListener('level-change', l2)
  instance.level = 'info'

  is(count, 6)
})

test('enable', async ({fail}) => {
  const instance = pino({
    level: 'trace',
    enabled: false
  }, sink((chunk, enc) => {
    fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })
})

test('silent level', async ({fail}) => {
  const instance = pino({
    level: 'silent'
  }, sink((chunk, enc) => {
    fail('no data should be logged')
  }))

  Object.keys(pino.levels.values).forEach((level) => {
    instance[level]('hello world')
  })
})

test('silent is a noop', async ({fail}) => {
  const instance = pino({
    level: 'silent'
  }, sink((chunk, enc) => {
    fail('no data should be logged')
  }))

  instance['silent']('hello world')
})

test('silent stays a noop after level changes', async ({is, isNot, fail}) => {
  const noop = require('../lib/tools').noop
  const instance = pino({
    level: 'silent'
  }, sink((chunk, enc) => {
    fail('no data should be logged')
  }))

  instance.level = 'trace'
  isNot(instance[instance.level], noop)

  instance.level = 'silent'
  instance['silent']('hello world')
  is(instance[instance.level], noop)
})

test('exposed levels', async ({same}) => {
  same(Object.keys(pino.levels.values), [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace'
  ])
})

test('exposed labels', async ({same}) => {
  same(Object.keys(pino.levels.labels), [
    '10',
    '20',
    '30',
    '40',
    '50',
    '60'
  ])
})

test('setting level in child', async ({is}) => {
  const expected = [{
    level: 50,
    msg: 'this is an error'
  }, {
    level: 60,
    msg: 'this is fatal'
  }]
  const instance = pino(sink((chunk, enc, cb) => {
    const current = expected.shift()
    check(is, chunk, current.level, current.msg)
    cb()
  })).child({ level: 30 })

  instance.level = 'error'
  instance.info('hello world')
  instance.error('this is an error')
  instance.fatal('this is fatal')
})
