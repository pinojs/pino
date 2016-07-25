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

test('child does not override parent serializers', function (t) {
  t.plan(2)

  var parent = pino({ serializers: parentSerializers })
  var child = parent.child({ serializers: childSerializers })

  t.deepEqual(parent.serializers, parentSerializers)
  t.deepEqual(child.serializers, childSerializers)
})

test('children inherit parent serializers', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers })
  var child = parent.child({a: 'property'})

  t.deepEqual(child.serializers, parentSerializers)
})

test('children serializers get called', function (t) {
  t.plan(1)

  var parent = pino({
    test: 'this'
  }, sink(function (chunk, enc, cb) {
    cb()
  }))

  var child = parent.child({ 'a': 'property', serializers: childSerializers })

  child.serializers.test = function () {
    t.ok('serializer called')
    return 'called'
  }

  child.fatal({test: 'test'})
})

test('children serializers get called when inherited from parent', function (t) {
  t.plan(1)

  var parent = pino({
    test: 'this',
    serializers: childSerializers
  }, sink(function (chunk, enc, cb) {
    cb()
  }))

  var child = parent.child({ 'a': 'property' })

  child.serializers.test = function () {
    t.ok('serializer called')
    return 'called'
  }

  child.fatal({test: 'test'})
})
