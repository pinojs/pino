'use strict'
// eslint-disable-next-line
if (typeof $1 !== 'undefined') $1 = arguments.callee.caller.arguments[0]

var test = require('tape')
var fresh = require('fresh-require')
var pino = require('../browser')

var parentSerializers = {
  test: function () { return 'parent' }
}

var childSerializers = {
  test: function () { return 'child' }
}

test('serializers override values', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers,
    browser: { serialize: true,
      write: function (o) {
        t.is(o.test, 'parent')
      }}})

  parent.fatal({test: 'test'})
})

test('without the serialize option, serializers do not override values', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers,
    browser: {
      write: function (o) {
        t.is(o.test, 'test')
      }}})

  parent.fatal({test: 'test'})
})

test('if serialize option is true, standard error serializer is auto enabled', function (t) {
  t.plan(1)
  var err = Error('test')
  err.code = 'test'
  err.type = 'Error' // get that cov
  var expect = pino.stdSerializers.err(err)

  var consoleError = console.error
  console.error = function (err) {
    t.deepEqual(err, expect)
  }

  var logger = fresh('../browser', require)({
    browser: { serialize: true }
  })

  console.error = consoleError

  logger.fatal(err)
})

test('if serialize option is array, standard error serializer is auto enabled', function (t) {
  t.plan(1)
  var err = Error('test')
  err.code = 'test'
  var expect = pino.stdSerializers.err(err)

  var consoleError = console.error
  console.error = function (err) {
    t.deepEqual(err, expect)
  }

  var logger = fresh('../browser', require)({
    browser: { serialize: [] }
  })

  console.error = consoleError

  logger.fatal(err)
})

test('if serialize option is array containing !stdSerializers.err, standard error serializer is disabled', function (t) {
  t.plan(1)
  var err = Error('test')
  err.code = 'test'
  var expect = err

  var consoleError = console.error
  console.error = function (err) {
    t.is(err, expect)
  }

  var logger = fresh('../browser', require)({
    browser: { serialize: ['!stdSerializers.err'] }
  })

  console.error = consoleError

  logger.fatal(err)
})

test('in browser, serializers apply to all objects', function (t) {
  t.plan(3)
  var consoleError = console.error
  console.error = function (test, test2, test3, test4, test5) {
    t.is(test.key, 'serialized')
    t.is(test2.key2, 'serialized2')
    t.is(test5.key3, 'serialized3')
  }

  var logger = fresh('../browser', require)({
    serializers: {
      key: function () { return 'serialized' },
      key2: function () { return 'serialized2' },
      key3: function () { return 'serialized3' }
    },
    browser: { serialize: true }
  })

  console.error = consoleError

  logger.fatal({key: 'test'}, {key2: 'test'}, 'str should skip', [{foo: 'array should skip'}], {key3: 'test'})
})

test('serialize can be an array of selected serializers', function (t) {
  t.plan(3)
  var consoleError = console.error
  console.error = function (test, test2, test3, test4, test5) {
    t.is(test.key, 'test')
    t.is(test2.key2, 'serialized2')
    t.is(test5.key3, 'test')
  }

  var logger = fresh('../browser', require)({
    serializers: {
      key: function () { return 'serialized' },
      key2: function () { return 'serialized2' },
      key3: function () { return 'serialized3' }
    },
    browser: { serialize: ['key2'] }
  })

  console.error = consoleError

  logger.fatal({key: 'test'}, {key2: 'test'}, 'str should skip', [{foo: 'array should skip'}], {key3: 'test'})
})

test('serialize filter applies to child loggers', function (t) {
  t.plan(3)
  var consoleError = console.error
  console.error = function (binding, test, test2, test3, test4, test5) {
    t.is(test.key, 'test')
    t.is(test2.key2, 'serialized2')
    t.is(test5.key3, 'test')
  }

  var logger = fresh('../browser', require)({
    browser: { serialize: ['key2'] }
  })

  console.error = consoleError

  logger.child({aBinding: 'test',
    serializers: {
      key: function () { return 'serialized' },
      key2: function () { return 'serialized2' },
      key3: function () { return 'serialized3' }
    }}).fatal({key: 'test'}, {key2: 'test'}, 'str should skip', [{foo: 'array should skip'}], {key3: 'test'})
})

test('parent serializers apply to child bindings', function (t) {
  t.plan(1)
  var consoleError = console.error
  console.error = function (binding) {
    t.is(binding.key, 'serialized')
  }

  var logger = fresh('../browser', require)({
    serializers: {
      key: function () { return 'serialized' }
    },
    browser: { serialize: true }
  })

  console.error = consoleError

  logger.child({key: 'test'}).fatal({test: 'test'})
})

test('child serializers apply to child bindings', function (t) {
  t.plan(1)
  var consoleError = console.error
  console.error = function (binding) {
    t.is(binding.key, 'serialized')
  }

  var logger = fresh('../browser', require)({
    browser: { serialize: true }
  })

  console.error = consoleError

  logger.child({key: 'test',
    serializers: {
      key: function () { return 'serialized' }
    }}).fatal({test: 'test'})
})

test('child does not overwrite parent serializers', function (t) {
  t.plan(2)

  var c = 0
  var parent = pino({ serializers: parentSerializers,
    browser: { serialize: true,
      write: function (o) {
        c++
        if (c === 1) t.is(o.test, 'parent')
        if (c === 2) t.is(o.test, 'child')
      }}})
  var child = parent.child({ serializers: childSerializers })

  parent.fatal({test: 'test'})
  child.fatal({test: 'test'})
})

test('children inherit parent serializers', function (t) {
  t.plan(1)

  var parent = pino({ serializers: parentSerializers,
    browser: { serialize: true,
      write: function (o) {
        t.is(o.test, 'parent')
      }}})

  var child = parent.child({a: 'property'})
  child.fatal({test: 'test'})
})

test('children serializers get called', function (t) {
  t.plan(1)

  var parent = pino({
    test: 'this',
    browser: { serialize: true,
      write: function (o) {
        t.is(o.test, 'child')
      }}})

  var child = parent.child({ 'a': 'property', serializers: childSerializers })

  child.fatal({test: 'test'})
})

test('children serializers get called when inherited from parent', function (t) {
  t.plan(1)

  var parent = pino({
    test: 'this',
    serializers: parentSerializers,
    browser: { serialize: true,
      write: function (o) {
        t.is(o.test, 'pass')
      }}})

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

  var parent = pino({ serializers: pSerializers,
    browser: { serialize: true,
      write: function (o) {
        c++
        if (c === 1) t.is(o.shared, 'child')
        if (c === 2) t.is(o.onlyParent, 'parent')
        if (c === 3) t.is(o.onlyChild, 'child')
        if (c === 4) t.is(o.onlyChild, 'test')
      }}})

  var child = parent.child({ serializers: cSerializers })

  child.fatal({shared: 'test'})
  child.fatal({onlyParent: 'test'})
  child.fatal({onlyChild: 'test'})
  parent.fatal({onlyChild: 'test'})
})
