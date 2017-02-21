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

  t.equal(parent.serializers.test(), 'parent')
  t.equal(child.serializers.test(), 'child')
})

test('children inherit parent serializers', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers })
  var child = parent.child({a: 'property'})

  t.equal(child.serializers.test(), 'parent')
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
  var parent = pino({ serializers: pSerializers })

  var child = parent.child({ serializers: cSerializers })

  t.equal(child.serializers.shared(), 'child')
  t.equal(child.serializers.onlyParent(), 'parent')
  t.equal(child.serializers.onlyChild(), 'child')
  t.notOk(parent.serializers.onlyChild)
})
