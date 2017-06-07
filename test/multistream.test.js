'use strict'

const test = require('tap').test
const pino = require('..')
const sink = require('./helper').sink

test('baisc multistream', function (t) {
  t.plan(2)

  const multistream = pino.multistream()
  const instance = pino({ level: 'debug' }, multistream)

  multistream.add(30, sink(function (chunk, enc, cb) {
    delete chunk.time
    delete chunk.pid
    delete chunk.hostname
    t.deepEqual(chunk, {
      level: 30,
      msg: 'info log line',
      v: 1
    })
    cb()
  }))

  multistream.add(20, sink(function (chunk, enc, cb) {
    delete chunk.time
    delete chunk.pid
    delete chunk.hostname
    t.deepEqual(chunk, {
      level: 20,
      msg: 'debug log line',
      v: 1
    })
    cb()
  }))

  instance.info('info log line')
  instance.debug('debug log line')
})
