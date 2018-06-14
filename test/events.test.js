'use strict'

var test = require('tap').test
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork
var spawn = require('child_process').spawn
var fixturesPath = path.join(__dirname, 'fixtures', 'events')

test('no event loop logs successfully', ({end, is}) => {
  var output = ''
  var child = fork(path.join(fixturesPath, 'no-event-loop.js'), {silent: true})

  child.stdout.pipe(writeStream((s, enc, cb) => {
    output += s
    cb()
  }))

  child.on('close', () => {
    is(/"msg":"h"/.test(output), true)
    end()
  })
})

test('terminates when uncaughtException is fired with onTerminate registered', ({end, is}) => {
  var output = ''
  var errorOutput = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'uncaught-exception.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(writeStream(function (s, enc, cb) {
    errorOutput += s
    cb()
  }))

  child.on('close', function () {
    is(/"msg":"h"/.test(output), true)
    is(/terminated/g.test(output), true)
    is(/this is not caught/g.test(errorOutput), true)
    end()
  })
})

test('terminates when uncaughtException is fired without onTerminate registered', ({end, is}) => {
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'uncaught-exception-no-terminate.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.on('exit', (code) => {
    is(code, 1)
  })

  child.on('close', () => {
    is(/"msg":"h"/.test(output), true)
    end()
  })
})

test('terminates on SIGHUP when no other handlers registered', ({end, is}) => {
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'sighup-no-handler.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(process.stdout)

  child.on('exit', function (code) {
    is(code, 0)
  })

  child.on('close', function () {
    is(/"msg":"h"/.test(output), true)
    end()
  })

  setTimeout(function () { child.kill('SIGHUP') }, 2000)
})

test('lets app terminate when SIGHUP received with multiple handlers', ({end, is}) => {
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'sighup-with-handler.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.on('exit', function (code) {
    is(code, 0)
  })

  child.on('close', function () {
    is(/"msg":"h"/.test(output), true)
    is(/app sighup/.test(output), true)
    end()
  })

  setTimeout(function () { child.kill('SIGHUP') }, 2000)
})

test('destination', ({end, is}) => {
  var output = ''
  var child = spawn(process.argv[0], [path.join(fixturesPath, 'destination.js')], {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(process.stdout)

  child.on('exit', (code) => {
    is(code, 0)
  })

  child.on('close', () => {
    is(/"msg":"h"/.test(output), true)
    end()
  })
})
