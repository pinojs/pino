'use strict'

var test = require('tap').test
var os = require('os')
var pino = require('../')
var sink = require('./helper').sink

var pid = process.pid
var hostname = os.hostname()

test('metadata works', ({end, ok, same, is}) => {
  var dest = sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      msg: 'a msg',
      v: 1
    })
  })
  var now = Date.now()
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write (chunk) {
      is(instance, this.lastLogger)
      is(30, this.lastLevel)
      is('a msg', this.lastMsg)
      ok(Number(this.lastTime) >= now)
      same({ hello: 'world' }, this.lastObj)
      dest.write(chunk)
    }
  })

  instance.info({ hello: 'world' }, 'a msg')
  end()
})

test('child loggers works', ({end, ok, same, is}) => {
  var dest = sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
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
    write (chunk) {
      is(child, this.lastLogger)
      is(30, this.lastLevel)
      is('a msg', this.lastMsg)
      same({ from: 'child' }, this.lastObj)
      dest.write(chunk)
    }
  })

  var child = instance.child({ hello: 'world' })
  child.info({ from: 'child' }, 'a msg')
  end()
})

test('without object', ({end, ok, same, is}) => {
  var dest = sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      msg: 'a msg',
      v: 1
    })
  })
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write (chunk) {
      is(instance, this.lastLogger)
      is(30, this.lastLevel)
      is('a msg', this.lastMsg)
      is(null, this.lastObj)
      dest.write(chunk)
    }
  })

  instance.info('a msg')
  end()
})

test('without msg', ({end, ok, same, is}) => {
  var dest = sink((chunk, enc) => {
    ok(new Date(chunk.time) <= new Date(), 'time is greater than Date.now()')
    delete chunk.time
    same(chunk, {
      pid: pid,
      hostname: hostname,
      level: 30,
      hello: 'world',
      v: 1
    })
  })
  var instance = pino({}, {
    [Symbol.for('needsMetadata')]: true,
    write (chunk) {
      is(instance, this.lastLogger)
      is(30, this.lastLevel)
      is(undefined, this.lastMsg)
      same({ hello: 'world' }, this.lastObj)
      dest.write(chunk)
    }
  })

  instance.info({ hello: 'world' })
  end()
})
