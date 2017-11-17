'use strict'

var test = require('tap').test
var pino = require('../')
var pretty = require('../pretty')
var os = require('os')
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork
var split = require('split2')
var hostname = os.hostname()

test('pino transform prettifies', function (t) {
  t.plan(4)
  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/(?!^)INFO.*/), 'includes level')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(prettier)

  instance.info('hello world')
})

test('pino pretty moves level to start on flag', function (t) {
  t.plan(4)
  var prettier = pretty({ levelFirst: true })
  prettier.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/^INFO.*/), 'level is at start of line')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))
  var instance = pino(prettier)

  instance.info('hello world')
})

test('pino pretty force color on flag', function (t) {
  t.plan(1)
  var prettier = pretty({ forceColor: true })
  prettier.pipe(split(function (line) {
    t.ok(line.match(/.*\u001b\[32mINFO\u001b\[39m.*\u001b\[36mhello world\u001b\[39m$/), 'color coding information is encoded in the line')
    return line
  }))
  var instance = pino(prettier)

  instance.info('hello world')
})
test('pino transform can just parse the dates', function (t) {
  t.plan(1)
  var prettier = pretty({ timeTransOnly: true })
  prettier.pipe(split(function (line) {
    var obj = JSON.parse(line)
    t.ok(typeof obj.time === 'string', 'time is a string')
    return line
  }))
  var instance = pino(prettier)

  instance.info('hello world')
})

test('pino transform can format with a custom function', function (t) {
  t.plan(8)
  var prettier = pretty({ formatter: function (line, opts) {
    t.ok(opts.prefix.indexOf('INFO') > -1, 'prefix contains level')
    t.ok(typeof opts.chalk.white === 'function', 'chalk instance')
    t.ok(typeof opts.withSpaces === 'function', 'withSpaces function')
    t.ok(typeof opts.filter === 'function', 'filter function')
    t.ok(typeof opts.formatTime === 'function', 'formatTime function')
    t.ok(typeof opts.asColoredText === 'function', 'asColoredText function')
    t.ok(typeof opts.asColoredLevel === 'function', 'asColoredLevel function')
    return 'msg: ' + line.msg + ', foo: ' + line.foo
  } })
  prettier.pipe(split(function (line) {
    t.ok(line === 'msg: hello world, foo: bar', 'line matches')
    return line
  }))
  var instance = pino(prettier)

  instance.info({foo: 'bar'}, 'hello world')
})

test('pino transform prettifies Error', function (t) {
  var prettier = pretty()
  var err = new Error('hello world')
  var expected = err.stack.split('\n')
  expected.unshift(err.message)

  t.plan(expected.length)

  prettier.pipe(split(function (line) {
    t.ok(line.indexOf(expected.shift()) >= 0, 'line matches')
    return line
  }))

  var instance = pino(prettier)

  instance.info(err)
})

test('pino transform preserve output if not valid JSON', function (t) {
  t.plan(1)
  var prettier = pretty()
  var lines = []
  prettier.pipe(split(function (line) {
    lines.push(line)
    return line
  }))

  prettier.write('this is not json\nit\'s just regular output\n')
  prettier.end()

  t.deepEqual(lines, ['this is not json', 'it\'s just regular output'], 'preserved lines')
})

test('handles missing time', function (t) {
  t.plan(1)
  var prettier = pretty()
  var lines = []
  prettier.pipe(split(function (line) {
    lines.push(line)
    return line
  }))

  prettier.write('{"hello":"world"}')
  prettier.end()

  t.deepEqual(lines, ['{"hello":"world"}'], 'preserved lines')
})

test('handles missing pid, hostname and name', function (t) {
  t.plan(1)

  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(line.match(/\[.*\] INFO: hello world/), 'line does not match')

    return line
  }))

  var instance = pino({ base: null }, prettier)

  instance.info('hello world')
})

test('handles missing pid', function (t) {
  t.plan(1)

  var name = 'test'
  var msg = 'hello world'
  var regex = new RegExp('\\[.*\\] INFO \\(' + name + ' on ' + hostname + '\\): ' + msg)

  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(regex.test(line), 'line does not match')

    return line
  }))

  var opts = {
    base: {
      name: name,
      hostname: hostname
    }
  }
  var instance = pino(opts, prettier)

  instance.info(msg)
})

test('handles missing hostname', function (t) {
  t.plan(1)

  var name = 'test'
  var msg = 'hello world'
  var regex = new RegExp('\\[.*\\] INFO \\(' + name + '/' + process.pid + '\\): ' + msg)

  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(regex.test(line), 'line does not match')

    return line
  }))

  var opts = {
    base: {
      name: name,
      pid: process.pid
    }
  }
  var instance = pino(opts, prettier)

  instance.info(msg)
})

test('handles missing name', function (t) {
  t.plan(1)

  var msg = 'hello world'
  var regex = new RegExp('\\[.*\\] INFO \\(' + process.pid + ' on ' + hostname + '\\): ' + msg)

  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(regex.test(line), 'line does not match')

    return line
  }))

  var opts = {
    base: {
      hostname: hostname,
      pid: process.pid
    }
  }
  var instance = pino(opts, prettier)

  instance.info(msg)
})

test('pino transform prettifies properties', function (t) {
  t.plan(1)
  var prettier = pretty()
  var first = true
  prettier.pipe(split(function (line) {
    if (first) {
      first = false
    } else {
      t.equal(line, '    a: "b"', 'prettifies the line')
    }
    return line
  }))
  var instance = pino(prettier)

  instance.info({ a: 'b' }, 'hello world')
})

test('pino transform treats the name with care', function (t) {
  t.plan(1)
  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(line.match(/\(matteo\/.*$/), 'includes the name')
    return line
  }))
  var instance = pino({ name: 'matteo' }, prettier)

  instance.info('hello world')
})

test('handles `null` input', function (t) {
  t.plan(1)
  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.is(line, 'null')
    return line
  }))
  prettier.write('null')
  prettier.end()
})

test('handles `undefined` input', function (t) {
  t.plan(1)
  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.is(line, 'undefined')
    return line
  }))
  prettier.write('undefined')
  prettier.end()
})

test('handles `true` input', function (t) {
  t.plan(1)
  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.is(line, 'true')
    return line
  }))
  prettier.write('true')
  prettier.end()
})

test('accept customLogLevel', function (t) {
  t.plan(1)
  var prettier = pretty()

  prettier.pipe(split(function (line) {
    t.ok(line.indexOf('USERLVL') > 0, 'include custom level')
    return line
  }))

  var instance = pino({level: 'testCustom', levelVal: 35}, prettier)

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

test('works without time', function (t) {
  t.plan(4)
  var prettier = pretty()
  prettier.pipe(split(function (line) {
    t.ok(line.match(/.*hello world$/), 'end of line matches')
    t.ok(line.match(/^INFO.*/), 'includes level')
    t.ok(line.indexOf('' + process.pid) > 0, 'includes pid')
    t.ok(line.indexOf('' + hostname) > 0, 'includes hostname')
    return line
  }))

  var instance = pino({
    timestamp: null
  }, prettier)

  instance.info('hello world')
})

test('throws error when enabled with stream specified', function (t) {
  t.plan(1)
  var logStream = writeStream(function (s, enc, cb) {
    cb()
  })

  t.throws(() => pino({prettyPrint: true}, logStream), {})
})

test('does not throw error when enabled with stream specified', function (t) {
  pino({prettyPrint: true}, process.stdout)
  t.end()
})
