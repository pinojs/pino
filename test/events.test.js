'use strict'

var test = require('tap').test
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork
var spawn = require('child_process').spawn
var fixturesPath = path.join(__dirname, 'fixtures', 'events')

test('no event loop logs successfully', function (t) {
  t.plan(1)
  var output = ''
  var child = fork(path.join(fixturesPath, 'no-event-loop.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(null, output.match(/"msg":"h"/))
  })
})

test('terminates when uncaughtException is fired with onTerminate registered', function (t) {
  t.plan(3)
  var output = ''
  var errorOutput = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'uncaughtException.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(writeStream(function (s, enc, cb) {
    errorOutput += s
    cb()
  }))

  child.on('close', function () {
    t.notEqual(null, output.match(/"msg":"h"/))
    t.notEqual(null, output.match(/terminated/g))
    t.notEqual(null, errorOutput.match(/this is not caught/g))
  })
})

test('terminates when uncaughtException is fired without onTerminate registered', function (t) {
  t.plan(2)
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'uncaughtException-noTerminate.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.on('exit', function (code) {
    t.is(code, 1)
  })

  child.on('close', function () {
    t.notEqual(null, output.match(/"msg":"h"/))
  })
})

test('terminates on SIGHUP when no other handlers registered', function (t) {
  t.plan(2)
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'sighup-no-handler.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(process.stdout)

  child.on('exit', function (code) {
    t.is(code, 0)
  })

  child.on('close', function () {
    t.notEqual(null, output.match(/"msg":"h"/))
  })

  setTimeout(function () { child.kill('SIGHUP') }, 2000)
})

test('lets app terminate when SIGHUP received with multiple handlers', function (t) {
  t.plan(3)
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'sighup-with-handler.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.on('exit', function (code) {
    t.is(code, 0)
  })

  child.on('close', function () {
    t.notEqual(null, output.match(/"msg":"h"/))
    t.notEqual(null, output.match(/app sighup/))
  })

  setTimeout(function () { child.kill('SIGHUP') }, 2000)
})

test('destination', function (t) {
  t.plan(2)
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'destination.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(process.stdout)

  child.on('exit', function (code) {
    t.is(code, 0)
  })

  child.on('close', function () {
    t.notEqual(null, output.match(/"msg":"h"/))
  })
})
