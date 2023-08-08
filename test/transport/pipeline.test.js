'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { watchFileCreated, file } = require('../helper')
const { test } = require('tap')
const pino = require('../../')

const { pid } = process
const hostname = os.hostname()

test('pino.transport with a pipeline', async ({ same, teardown }) => {
  const destination = file()
  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
})

test('pino.transport with a pipeline and last transport is writable and not readable', async ({ same, teardown }) => {
  const destination = file()
  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('should fail when pino.transport with a pipeline have no transports', ({ plan, equal }) => {
  plan(1)
  const pipelinedInstance = pino.transport({
    pipeline: []
  })

  pipelinedInstance.on('error', function (e) {
    equal(e.message, 'targets must not be empty')
  })
})

test('should fail when pino.transport with a pipeline that last transport is readable', ({ plan, equal }) => {
  plan(1)
  const pipelinedInstance = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
    }]
  })

  pipelinedInstance.on('error', function (e) {
    equal(e.message, 'last target should not be readable (Duplex and Transform are readable as well), instead it should be a Writable stream')
  })
})
