'use strict'

const test = require('node:test')
const assert = require('node:assert')
const os = require('node:os')
const { join } = require('node:path')
const { once } = require('node:events')
const { setImmediate: immediate } = require('node:timers/promises')
const { readFile, writeFile } = require('node:fs').promises
const url = require('url')
const strip = require('strip-ansi')
const execa = require('execa')
const writer = require('flush-write-stream')
const rimraf = require('rimraf')
const tspl = require('@matteo.collina/tspl')

const { match, watchFileCreated, watchForWrite, file } = require('../helper')
const pino = require('../../')

const { tmpdir } = os
const pid = process.pid
const hostname = os.hostname()

test('pino.transport with file', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with file (no options + error handling)', async () => {
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js')
  })
  const [err] = await once(transport, 'error')
  assert.equal(err.message, 'kaboom')
})

test('pino.transport with file URL', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: url.pathToFileURL(join(__dirname, '..', 'fixtures', 'to-file-transport.js')).href,
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport errors if file does not exists', (t, end) => {
  const instance = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'non-existent-file'),
    worker: {
      stdin: true,
      stdout: true,
      stderr: true
    }
  })
  instance.on('error', function () {
    assert.ok('error received')
    end()
  })
})

test('pino.transport errors if transport worker module does not export a function', async (t) => {
  // TODO: add case for non-pipelined single target (needs changes in thread-stream)
  const plan = tspl(t, { plan: 2 })
  const manyTargetsInstance = pino.transport({
    targets: [{
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'transport-wrong-export-type.js')
    }, {
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'transport-wrong-export-type.js')
    }]
  })
  manyTargetsInstance.on('error', function (e) {
    plan.equal(e.message, 'exported worker is not a function')
  })

  const pipelinedInstance = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-wrong-export-type.js')
    }]
  })
  pipelinedInstance.on('error', function (e) {
    plan.equal(e.message, 'exported worker is not a function')
  })

  await plan
})

test('pino.transport with esm', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.mjs'),
    options: { destination }
  })
  const instance = pino(transport)
  t.after(transport.end.bind(transport))
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with two files', async (t) => {
  const dest1 = file()
  const dest2 = file()
  const transport = pino.transport({
    targets: [{
      level: 'info',
      target: 'file://' + join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest1 }
    }, {
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest2 }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  assert.deepEqual(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with two files and custom levels', async (t) => {
  const dest1 = file()
  const dest2 = file()
  const transport = pino.transport({
    targets: [{
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest1 }
    }, {
      level: 'foo',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest2 }
    }],
    levels: { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60, foo: 25 }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  assert.deepEqual(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport without specifying default levels', async (t) => {
  const dest = file()
  const transport = pino.transport({
    targets: [{
      level: 'foo',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest }
    }],
    levels: { foo: 25 }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest)])
  const result1 = JSON.parse(await readFile(dest))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with two files and dedupe', async (t) => {
  const dest1 = file()
  const dest2 = file()
  const transport = pino.transport({
    dedupe: true,
    targets: [{
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest1 }
    }, {
      level: 'error',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination: dest2 }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  instance.error('world')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  assert.deepEqual(result2, {
    pid,
    hostname,
    level: 50,
    msg: 'world'
  })
})

test('pino.transport with single target in targets array honors level filter (#1996)', async (t) => {
  const destination = file()
  const transport = pino.transport({
    targets: [{
      level: 'error',
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino({ level: 'debug' }, transport)
  instance.debug('debug-msg')
  instance.info('info-msg')
  instance.warn('warn-msg')
  instance.error('error-msg')
  await watchForWrite(destination, 'error-msg')
  const lines = (await readFile(destination, 'utf8')).trim().split('\n').filter(Boolean)
  assert.equal(lines.length, 1, 'only error should be written to destination')
  const result = JSON.parse(lines[0])
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 50,
    msg: 'error-msg'
  })
})

test('pino.transport with single target in targets array without level keeps logger.level gating', async (t) => {
  const destination = file()
  const transport = pino.transport({
    targets: [{
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino({ level: 'debug' }, transport)
  instance.debug('debug-msg')
  instance.info('info-msg')
  await watchForWrite(destination, 'info-msg')
  const lines = (await readFile(destination, 'utf8')).trim().split('\n').filter(Boolean)
  assert.equal(lines.length, 2, 'both debug and info reach the single target when no per-target level is set')
  const first = JSON.parse(lines[0])
  delete first.time
  assert.deepEqual(first, {
    pid,
    hostname,
    level: 20,
    msg: 'debug-msg'
  })
})

test('pino.transport with an array including a pino-pretty destination', async (t) => {
  const dest1 = file()
  const dest2 = file()
  const transport = pino.transport({
    targets: [{
      level: 'info',
      target: 'pino/file',
      options: {
        destination: dest1
      }
    }, {
      level: 'info',
      target: 'pino-pretty',
      options: {
        destination: dest2
      }
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
  const actual = (await readFile(dest2)).toString()
  assert.match(strip(actual), /\[.*\] INFO.*hello/)
})

test('no transport.end()', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination }
  })
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('autoEnd = false', async (t) => {
  const destination = file()
  const count = process.listenerCount('exit')
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
    options: { destination },
    worker: { autoEnd: false }
  })
  t.after(transport.end.bind(transport))
  await once(transport, 'ready')

  const instance = pino(transport)
  instance.info('hello')

  await watchFileCreated(destination)

  assert.equal(count, process.listenerCount('exit'))

  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with target and targets', async () => {
  assert.throws(
    () => {
      pino.transport({
        target: '/a/file',
        targets: [{
          target: '/a/file'
        }]
      })
    },
    /only one of target or targets can be specified/
  )
})

test('pino.transport with target pino/file', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: 'pino/file',
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with target pino/file and mkdir option', async (t) => {
  const folder = join(tmpdir(), `pino-${process.pid}-mkdir-transport-file`)
  const destination = join(folder, 'log.txt')
  t.after(() => {
    try {
      rimraf.sync(folder)
    } catch (err) {
      // ignore
    }
  })
  const transport = pino.transport({
    target: 'pino/file',
    options: { destination, mkdir: true }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

test('pino.transport with target pino/file and append option', async (t) => {
  const destination = file()
  await writeFile(destination, JSON.stringify({ pid, hostname, time: Date.now(), level: 30, msg: 'hello' }))
  const transport = pino.transport({
    target: 'pino/file',
    options: { destination, append: false }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('goodbye')
  await watchForWrite(destination, '"goodbye"')
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'goodbye'
  })
})

test('pino.transport should error with unknown target', async () => {
  assert.throws(
    () => {
      pino.transport({
        target: 'origin',
        caller: 'unknown-file.js'
      })
    },
    /unable to determine transport target for "origin"/
  )
})

test('pino.transport with target pino-pretty', async (t) => {
  const destination = file()
  const transport = pino.transport({
    target: 'pino-pretty',
    options: { destination }
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const actual = await readFile(destination, 'utf8')
  assert.match(strip(actual), /\[.*\] INFO.*hello/)
})

test('sets worker data informing the transport that pino will send its config', async (t) => {
  const plan = tspl(t, { plan: 1 })
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'transport-worker-data.js')
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  transport.once('workerData', (workerData) => {
    match(workerData.workerData, { pinoWillSendConfig: true })
    plan.ok('passed')
  })
  instance.info('hello')

  await plan
})

test('sets worker data informing the transport that pino will send its config (frozen file)', async (t) => {
  const plan = tspl(t, { plan: 1 })
  const config = {
    transport: {
      target: join(__dirname, '..', 'fixtures', 'transport-worker-data.js'),
      options: {}
    }
  }
  Object.freeze(config)
  Object.freeze(config.transport)
  Object.freeze(config.transport.options)
  const instance = pino(config)
  const transport = instance[pino.symbols.streamSym]
  t.after(transport.end.bind(transport))
  transport.once('workerData', (workerData) => {
    match(workerData.workerData, { pinoWillSendConfig: true })
    plan.ok('passed')
  })
  instance.info('hello')

  await plan
})

test('warns when custom formatters.level is incompatible with multi-target transport routing', async (t) => {
  const warnings = []
  const originalEmitWarning = process.emitWarning
  process.emitWarning = function (warning, options) {
    warnings.push({ warning, options })
  }
  t.after(() => {
    process.emitWarning = originalEmitWarning
  })

  const transport = pino.transport({
    targets: [
      { target: join(__dirname, '..', 'fixtures', 'noop-transport.js') },
      { target: join(__dirname, '..', 'fixtures', 'noop-transport.js') }
    ]
  })
  t.after(transport.end.bind(transport))

  const instance = pino({
    formatters: {
      level (label) {
        return { severity: label }
      }
    }
  }, transport)

  instance.info('hello')

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].options.code, 'PINO_TRANSPORT_MULTI_TARGETS_LEVEL_FORMATTER')
})

function createMultiNoopTransport (t) {
  const transport = pino.transport({
    targets: [
      { target: join(__dirname, '..', 'fixtures', 'noop-transport.js') },
      { target: join(__dirname, '..', 'fixtures', 'noop-transport.js') }
    ]
  })
  t.after(transport.end.bind(transport))
  return transport
}

function captureWarnings (t) {
  const warnings = []
  const originalEmitWarning = process.emitWarning
  process.emitWarning = function (warning, options) {
    warnings.push({ warning, options })
  }
  t.after(() => {
    process.emitWarning = originalEmitWarning
  })
  return warnings
}

test('does not warn and routes logs when custom formatters.level preserves numeric level with multi-target transport', async (t) => {
  const warnings = captureWarnings(t)

  const dest1 = file()
  const dest2 = file()
  const transport = pino.transport({
    targets: [
      {
        level: 'info',
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: dest1 }
      },
      {
        level: 'error',
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: dest2 }
      }
    ]
  })
  t.after(transport.end.bind(transport))

  const calls = []
  const instance = pino({
    formatters: {
      level (label, number) {
        calls.push([label, number])
        return { level: Number(number), severity: label.toUpperCase() }
      }
    }
  }, transport)

  assert.equal(warnings.length, 0)
  assert.equal(calls.length, 6)
  assert.deepEqual(calls, [
    ['trace', 10],
    ['debug', 20],
    ['info', 30],
    ['warn', 40],
    ['error', 50],
    ['fatal', 60]
  ])

  instance.info('hello')
  instance.error('oops')
  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  await watchForWrite(dest1, '"oops"')

  const lines1 = (await readFile(dest1, 'utf8')).trim().split('\n').map(line => JSON.parse(line))
  assert.equal(lines1.length, 2)
  assert.equal(lines1[0].level, 30)
  assert.equal(lines1[0].severity, 'INFO')
  assert.equal(lines1[0].msg, 'hello')
  assert.equal(lines1[1].level, 50)
  assert.equal(lines1[1].severity, 'ERROR')
  assert.equal(lines1[1].msg, 'oops')

  const lines2 = (await readFile(dest2, 'utf8')).trim().split('\n').map(line => JSON.parse(line))
  assert.equal(lines2.length, 1)
  assert.equal(lines2[0].level, 50)
  assert.equal(lines2[0].severity, 'ERROR')
  assert.equal(lines2[0].msg, 'oops')
})

test('multi-target level formatter validation supports custom level 0, overridden level value, and string numeric custom level', async (t) => {
  const warnings = captureWarnings(t)
  const calls = []
  pino({
    customLevels: { all: 0, custom: 30, str: '35' },
    level: 0,
    formatters: {
      level (label, number) {
        calls.push([label, number])
        return { level: Number(number), label }
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 0)
  assert.deepEqual(calls[0], ['all', 0])
  assert.ok(calls.some(([label, number]) => label === 'custom' && number === 30))
  assert.ok(calls.some(([label, number]) => label === 'str' && number === 35))
})

test('multi-target level formatter validation does not warn or pass silent for a valid formatter on a silent logger', async (t) => {
  const warnings = captureWarnings(t)
  const calls = []
  pino({
    level: 'silent',
    formatters: {
      level (label, number) {
        calls.push([label, number])
        return { level: number, label }
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 0)
  assert.equal(calls.length, 6)
  assert.ok(calls.every(([label, number]) => label !== 'silent' && Number.isFinite(number)))
})

test('multi-target level formatter validation warns for an incompatible formatter on a silent logger', async (t) => {
  const warnings = captureWarnings(t)
  pino({
    level: 'silent',
    formatters: {
      level (label) {
        return { level: label }
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].options.code, 'PINO_TRANSPORT_MULTI_TARGETS_LEVEL_FORMATTER')
})

test('multi-target level formatter validation skips empty customLevels with useOnlyCustomLevels', async (t) => {
  const warnings = captureWarnings(t)
  const calls = []
  pino({
    customLevels: {},
    useOnlyCustomLevels: true,
    level: 'silent',
    formatters: {
      level (label, number) {
        calls.push([label, number])
        return { level: number }
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(calls.length, 0)
  assert.equal(warnings.length, 0)
})

test('multi-target level formatter validation warns when a formatter drops numeric level on another level', async (t) => {
  const warnings = captureWarnings(t)
  pino({
    level: 'info',
    formatters: {
      level (label, number) {
        return label === 'error' ? { severity: 'ERROR' } : { level: number }
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].options.code, 'PINO_TRANSPORT_MULTI_TARGETS_LEVEL_FORMATTER')
})

test('multi-target level formatter validation warns when level is only inherited', async (t) => {
  const warnings = captureWarnings(t)
  pino({
    formatters: {
      level (_label, number) {
        return Object.create({ level: number })
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].options.code, 'PINO_TRANSPORT_MULTI_TARGETS_LEVEL_FORMATTER')
})

test('multi-target level formatter validation warns when level is dropped by toJSON', async (t) => {
  const warnings = captureWarnings(t)
  pino({
    formatters: {
      level (label, number) {
        return {
          level: number,
          toJSON () {
            return { severity: label }
          }
        }
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].options.code, 'PINO_TRANSPORT_MULTI_TARGETS_LEVEL_FORMATTER')
})

test('multi-target level formatter validation warns when formatter returns a non-object value like null', async (t) => {
  const warnings = captureWarnings(t)
  pino({
    formatters: {
      level () {
        return null
      }
    }
  }, createMultiNoopTransport(t))

  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].options.code, 'PINO_TRANSPORT_MULTI_TARGETS_LEVEL_FORMATTER')
})

test('multi-target level formatter validation does not emit a warning when formatters.level throws during init', async (t) => {
  const warnings = captureWarnings(t)
  assert.throws(() => {
    pino({
      formatters: {
        level () {
          throw new Error('formatter failure')
        }
      }
    }, createMultiNoopTransport(t))
  }, /formatter failure/)
  assert.equal(warnings.length, 0)
})

test('stdout in worker', async () => {
  let actual = ''
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-main.js')])

  for await (const chunk of child.stdout) {
    actual += chunk
  }
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('log and exit on ready', async () => {
  let actual = ''
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-exit-on-ready.js')])

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  await immediate()
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('log and exit before ready', async () => {
  let actual = ''
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-exit-immediately.js')])

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  await immediate()
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('log and exit before ready with async dest', async () => {
  const destination = file()
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-exit-immediately-with-async-dest.js'), destination])

  await once(child, 'exit')

  const actual = await readFile(destination, 'utf8')
  assert.equal(strip(actual).match(/HELLO/) != null, true)
  assert.equal(strip(actual).match(/WORLD/) != null, true)
})

test('string integer destination', async () => {
  let actual = ''
  const child = execa(process.argv[0], [join(__dirname, '..', 'fixtures', 'transport-string-stdout.js')])

  child.stdout.pipe(writer((s, enc, cb) => {
    actual += s
    cb()
  }))
  await once(child, 'close')
  await immediate()
  assert.equal(strip(actual).match(/Hello/) != null, true)
})

test('pino transport options with target', async (t) => {
  const destination = file()
  const instance = pino({
    transport: {
      target: 'pino/file',
      options: { destination }
    }
  })
  const transportStream = instance[pino.symbols.streamSym]
  t.after(transportStream.end.bind(transportStream))
  instance.info('transport option test')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'transport option test'
  })
})

test('pino transport options with targets', async (t) => {
  const dest1 = file()
  const dest2 = file()
  const instance = pino({
    transport: {
      targets: [
        { target: 'pino/file', options: { destination: dest1 } },
        { target: 'pino/file', options: { destination: dest2 } }
      ]
    }
  })
  const transportStream = instance[pino.symbols.streamSym]
  t.after(transportStream.end.bind(transportStream))
  instance.info('transport option test')

  await Promise.all([watchFileCreated(dest1), watchFileCreated(dest2)])
  const result1 = JSON.parse(await readFile(dest1))
  delete result1.time
  assert.deepEqual(result1, {
    pid,
    hostname,
    level: 30,
    msg: 'transport option test'
  })
  const result2 = JSON.parse(await readFile(dest2))
  delete result2.time
  assert.deepEqual(result2, {
    pid,
    hostname,
    level: 30,
    msg: 'transport option test'
  })
})

test('transport options with target and targets', async () => {
  assert.throws(
    () => {
      pino({
        transport: {
          target: {},
          targets: {}
        }
      })
    },
    /only one of target or targets can be specified/
  )
})

test('transport options with target and stream', async () => {
  assert.throws(
    () => {
      pino({
        transport: {
          target: {}
        }
      }, '/log/null')
    },
    /only one of option.transport or stream can be specified/
  )
})

test('transport options with stream', async (t) => {
  const dest1 = file()
  const transportStream = pino.transport({ target: 'pino/file', options: { destination: dest1 } })
  t.after(transportStream.end.bind(transportStream))
  assert.throws(
    () => {
      pino({
        transport: transportStream
      })
    },
    Error('option.transport do not allow stream, please pass to option directly. e.g. pino(transport)')
  )
})

test('pino.transport handles prototype pollution of __bundlerPathsOverrides', async (t) => {
  // eslint-disable-next-line no-extend-native
  Object.prototype.__bundlerPathsOverrides = { 'pino/file': '/malicious/path' }
  t.after(() => {
    delete Object.prototype.__bundlerPathsOverrides
  })

  const destination = file()
  const transport = pino.transport({
    target: 'pino/file',
    options: { destination }
  })
  t.after(transport.end.bind(transport))

  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  assert.deepEqual(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

const hasThreadName = 'threadName' in require('worker_threads')

test('pino.transport with single target sets worker thread name to target', { skip: !hasThreadName }, async (t) => {
  const plan = tspl(t, { plan: 1 })
  const transport = pino.transport({
    target: join(__dirname, '..', 'fixtures', 'transport-worker-name.js')
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  transport.once('workerThreadName', (name) => {
    plan.equal(name, join(__dirname, '..', 'fixtures', 'transport-worker-name.js'))
  })
  instance.info('hello')

  await plan
})

test('pino.transport with targets sets worker thread name to pino.transport', { skip: !hasThreadName }, async (t) => {
  const plan = tspl(t, { plan: 1 })
  const transport = pino.transport({
    targets: [{
      level: 'info',
      target: join(__dirname, '..', 'fixtures', 'transport-worker-name.js')
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  transport.once('workerThreadName', (name) => {
    plan.equal(name, 'pino.transport')
  })
  instance.info('hello')

  await plan
})

test('pino.transport with pipeline sets worker thread name to pino.transport', { skip: !hasThreadName }, async (t) => {
  const plan = tspl(t, { plan: 1 })
  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-worker-name.js')
    }]
  })
  t.after(transport.end.bind(transport))
  const instance = pino(transport)
  transport.once('workerThreadName', (name) => {
    plan.equal(name, 'pino.transport')
  })
  instance.info('hello')

  await plan
})
