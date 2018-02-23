'use strict'
var test = require('tap').test
var pino = require('../')
var sink = require('./helper').sink

var parentSerializers = {
  test: function () { return 'parent' }
}

var childSerializers = {
  test: function () { return 'child' }
}

test('serializers override values', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers }, sink(function (o, enc, cb) {
    t.is(o.test, 'parent')
    cb()
  }))
  parent.child({ serializers: childSerializers })

  parent.fatal({test: 'test'})
})

test('child does not overwrite parent serializers', function (t) {
  t.plan(2)

  var c = 0
  var parent = pino({ serializers: parentSerializers }, sink(function (o, enc, cb) {
    c++
    if (c === 1) t.is(o.test, 'parent')
    if (c === 2) t.is(o.test, 'child')
    cb()
  }))
  var child = parent.child({ serializers: childSerializers })

  parent.fatal({test: 'test'})
  child.fatal({test: 'test'})
})

test('children inherit parent serializers', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers }, sink(function (o, enc, cb) {
    t.is(o.test, 'parent')
  }))

  var child = parent.child({a: 'property'})
  child.fatal({test: 'test'})
})

test('children serializers get called', function (t) {
  t.plan(1)

  var parent = pino({
    test: 'this'
  }, sink(function (o, enc, cb) {
    t.is(o.test, 'child')
    cb()
  }))

  var child = parent.child({ 'a': 'property', serializers: childSerializers })

  child.fatal({test: 'test'})
})

test('children serializers get called when inherited from parent', function (t) {
  t.plan(1)

  var parent = pino({
    test: 'this',
    serializers: parentSerializers
  }, sink(function (o, enc, cb) {
    t.is(o.test, 'pass')
    cb()
  }))

  var child = parent.child({serializers: {test: function () { return 'pass' }}})

  child.fatal({test: 'fail'})
})

test('non overriden serializers are available in the children', function (t) {
  t.plan(4)
  var pSerializers = {
    onlyParent: function () { return 'parent' },
    shared: function () { return 'parent' }
  }

  var cSerializers = {
    shared: function () { return 'child' },
    onlyChild: function () { return 'child' }
  }

  var c = 0

  var parent = pino({ serializers: pSerializers }, sink(function (o, enc, cb) {
    c++
    if (c === 1) t.is(o.shared, 'child')
    if (c === 2) t.is(o.onlyParent, 'parent')
    if (c === 3) t.is(o.onlyChild, 'child')
    if (c === 4) t.is(o.onlyChild, 'test')
    cb()
  }))

  var child = parent.child({ serializers: cSerializers })

  child.fatal({shared: 'test'})
  child.fatal({onlyParent: 'test'})
  child.fatal({onlyChild: 'test'})
  parent.fatal({onlyChild: 'test'})
})

test('Symbol.for(\'pino.*\') serializer', function (t) {
  t.plan(6)
  var globalSerializer = {
    [Symbol.for('pino.*')]: function (obj) {
      if (obj.lionel === 'richie') {
        return {hello: 'is', it: 'me', you: 'are', looking: 'for'}
      }
      return {lionel: 'richie'}
    }
  }
  var c = 0
  var logger = pino({serializers: globalSerializer}, sink(function (o, enc, cb) {
    c++
    if (c === 1) { t.match(o, {lionel: 'richie'}); t.notMatch(o, ['hello', 'it', 'you', 'looking']) }
    if (c === 2) { t.match(o, {hello: 'is', it: 'me', you: 'are', looking: 'for'}); t.notMatch(o, ['lionel']) }
    if (c === 3) { t.match(o, {lionel: 'richie'}); t.notMatch(o, ['pid', 'hostname']) }
    cb()
  }))

  logger.info({hello: 'is', it: 'me', you: 'are', looking: 'for'})
  logger.info({lionel: 'richie'})
  logger.info('message')
})
