'use strict'

var test = require('tap').test
var path = require('path')
var writeStream = require('flush-write-stream')
var fork = require('child_process').fork
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
    t.notEqual(output.match(/"msg":"h"/), null)
  })
})

test('handles no file descriptor in extreme mode', function (t) {
  t.plan(2)
  var output = ''
  var errorOutput = ''
  var child = fork(path.join(fixturesPath, 'no-fd.js'), {silent: true})

  child.stdout.pipe(writeStream(function (s, enc, cb) {
    output += s
    cb()
  }))

  child.stderr.pipe(writeStream(function (s, enc, cb) {
    errorOutput += s
    cb()
  }))

  child.on('close', function () {
    t.is(output, '')
    t.notEqual(errorOutput.match(/stream must have/g), null)
  })
})
