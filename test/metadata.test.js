'use strict'

var test = require('tap').test
var os = require('os')
var pino = require('../')
var sink = require('./helper').sink

var pid = process.pid
var hostname = os.hostname()

test('metadata works', function (t) {
  t.plan(6)
  var dest = sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      msg: 'a msg',
      v: 1
    })
  })
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write: function (chunk) {
      t.equal(instance, this.lastLogger)
      t.equal(30, this.lastLevel)
      t.equal('a msg', this.lastMsg)
      t.deepEqual({ hello: 'world' }, this.lastObj)
      dest.write(chunk)
    }
  })

  instance.info({ hello: 'world' }, 'a msg')
})

test('child loggers works', function (t) {
  t.plan(6)
  var dest = sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      from: 'child',
      msg: 'a msg',
      v: 1
    })
  })
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write: function (chunk) {
      t.equal(child, this.lastLogger)
      t.equal(30, this.lastLevel)
      t.equal('a msg', this.lastMsg)
      t.deepEqual({ from: 'child' }, this.lastObj)
      dest.write(chunk)
    }
  })

  var child = instance.child({ hello: 'world' })
  child.info({ from: 'child' }, 'a msg')
})

test('without object', function (t) {
  t.plan(6)
  var dest = sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'a msg',
      v: 1
    })
  })
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write: function (chunk) {
      t.equal(instance, this.lastLogger)
      t.equal(30, this.lastLevel)
      t.equal('a msg', this.lastMsg)
      t.equal(null, this.lastObj)
      dest.write(chunk)
    }
  })

  instance.info('a msg')
})

test('without msg', function (t) {
  t.plan(6)
  var dest = sink(function (chunk, enc, cb) {
    t.ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    t.deepEqual(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      v: 1
    })
  })
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write: function (chunk) {
      t.equal(instance, this.lastLogger)
      t.equal(30, this.lastLevel)
      t.equal(undefined, this.lastMsg)
      t.deepEqual({ hello: 'world' }, this.lastObj)
      dest.write(chunk)
    }
  })

  instance.info({ hello: 'world' })
})
