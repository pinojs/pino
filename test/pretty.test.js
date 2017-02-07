'use strict'

var test = require('tap').test
var pino = require('../')
var os = require('os')
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork
var split = require('split2')
var hostname = os.hostname()

test('pino transform prettifies', function (t) {
  t.plan(4)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/(?!^)INFO.*/), 'includes level')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('pino pretty moves level to start on flag', function (t) {
  t.plan(4)
  var pretty = pino.pretty({ levelFirst: true })
  pretty.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/^INFO.*/), 'level is at start of line')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('pino transform can just parse the dates', function (t) {
  t.plan(1)
  var pretty = pino.pretty({ timeTransOnly: true })
  pretty.pipe(split(function (line) {
    var obj = JSON.parse(line)
    t.ok(typeof obj.time === 'string', 'time is a string')
    return line
  }))
  var instance = pino(pretty)

  instance.info('hello world')
})

test('pino transform can format with a custom function', function (t) {
  t.plan(1)
  var pretty = pino.pretty({ formatter: function (line) {
    return 'msg: ' + line.msg + ', foo: ' + line.foo
  } })
  pretty.pipe(split(function (line) {
    t.ok(line === 'msg: hello world, foo: bar', 'line matches')
    return line
  }))
  var instance = pino(pretty)

  instance.info({foo: 'bar'}, 'hello world')
})

test('pino transform prettifies Error', function (t) {
  var pretty = pino.pretty()
  var err = new Error('hello world')
  var expected = err.stack.split('\n')
  expected.unshift(err.message)

  t.plan(expected.length)

  pretty.pipe(split(function (line) {
    t.ok(line.indexOf(expected.shift()) >= 0, 'line matches')
    return line
  }))

  var instance = pino(pretty)

  instance.info(err)
})

test('pino transform preserve output if not valid JSON', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  var lines = []
  pretty.pipe(split(function (line) {
    lines.push(line)
    return line
  }))

  pretty.write('this is not json\nit\'s just regular output\n')
  pretty.end()

  t.deepEqual(lines, ['this is not json', 'it\'s just regular output'], 'preserved lines')
})

test('handles missing time', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  var lines = []
  pretty.pipe(split(function (line) {
    lines.push(line)
    return line
  }))

  pretty.write('{"hello":"world"}')
  pretty.end()

  t.deepEqual(lines, ['{"hello":"world"}'], 'preserved lines')
})

test('pino transform prettifies properties', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  var first = true
  pretty.pipe(split(function (line) {
    if (first) {
      first = false
    } else {
      t.equal(line, '    a: "b"', 'prettifies the line')
    }
    return line
  }))
  var instance = pino(pretty)

  instance.info({ a: 'b' }, 'hello world')
})

test('pino transform treats the name with care', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.ok(line.match(/\(matteo\/.*$/), 'includes the name')
    return line
  }))
  var instance = pino({ name: 'matteo' }, pretty)

  instance.info('hello world')
})

test('handles `null` input', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.is(line, 'null')
    return line
  }))
  pretty.write('null')
  pretty.end()
})

test('handles `undefined` input', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.is(line, 'undefined')
    return line
  }))
  pretty.write('undefined')
  pretty.end()
})

test('handles `true` input', function (t) {
  t.plan(1)
  var pretty = pino.pretty()
  pretty.pipe(split(function (line) {
    t.is(line, 'true')
    return line
  }))
  pretty.write('true')
  pretty.end()
})

test('accept customLogLevvel', function (t) {
  t.plan(1)
  var pretty = pino.pretty()

  pretty.pipe(split(function (line) {
    t.ok(line.indexOf('USERLVL') > 0, 'include custom level')
    return line
  }))

  var instance = pino({level: 'testCustom', levelVal: 35}, pretty)

  instance.testCustom('test message')
})

test('can be enabled via constructor', function (t) {
  t.plan(1)
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'basic.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(actual.match(/\(123456 on abcdefghijklmnopqr\): h/), null)
  })
})

test('can be enabled via constructor with pretty configuration', function (t) {
  t.plan(1)
  var actual = ''
  var child = fork(path.join(__dirname, 'fixtures', 'pretty', 'levelFirst.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    actual += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(actual.match(/^INFO.*h/), null)
  })
})
