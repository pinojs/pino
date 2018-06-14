'use strict'

const { test } = require('tap')
const { join } = require('path')
const { fork, spawn } = require('child_process')
const writer = require('flush-write-stream')

const fixtures = join(__dirname, 'fixtures', 'events')

test('no event loop logs successfully', ({end, is}) => {
  var output = ''
  var child = fork(join(fixtures, 'no-event-loop.js'), {silent: true})

  child.stdout.pipe(writer((s, enc, cb) => {
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
  var child = spawn(process.argv[0], [join(fixtures, 'uncaught-exception.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(writer(function (s, enc, cb) {
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
  var child = spawn(process.argv[0], [join(fixtures, 'uncaught-exception-no-terminate.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
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
  var child = spawn(process.argv[0], [join(fixtures, 'sighup-no-handler.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
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

  setTimeout(() => { child.kill('SIGHUP') }, 2000)
})

test('lets app terminate when SIGHUP received with multiple handlers', ({end, is}) => {
  var output = ''
  var child = spawn(process.argv[0], [join(fixtures, 'sighup-with-handler.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
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

  setTimeout(() => { child.kill('SIGHUP') }, 2000)
})

test('destination', ({end, is}) => {
  var output = ''
  var child = spawn(process.argv[0], [join(fixtures, 'destination.js')], {silent: true})

  child.stdout.pipe(writer(function (s, enc, cb) {
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
