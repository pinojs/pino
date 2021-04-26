'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { test } = require('tap')
const { watchFileCreated } = require('./helper')
const pino = require('../')
const strip = require('strip-ansi')

const { pid } = process
const hostname = os.hostname()

test('pino.multitransport with two files', async ({ same }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.multitransport({
    transports: [{
      level: 'info',
      module: join(__dirname, 'fixtures', 'to-file-transport.js'),
      opts: { dest: dest1 }
    }, {
      level: 'info',
      module: join(__dirname, 'fixtures', 'to-file-transport.js'),
      opts: { dest: dest2 }
    }]
  })
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  same(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  same(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.multitransport with two files', async ({ same }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.multitransport({
    transports: [{
      level: 'info',
      destination: dest1
    }, {
      level: 'info',
      destination: dest2
    }]
  })
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  same(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  same(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.multitransport with a prettyPrint destination', async ({ same, match }) => {
  const dest1 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const dest2 = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.multitransport({
    transports: [{
      level: 'info',
      destination: dest1
    }, {
      level: 'info',
      prettyPrint: true,
      destination: dest2
    }]
  })
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  same(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const actual = (await readFile(dest2)).toString()
  match(strip(actual), /\[.*\] INFO.*hello/)
})
