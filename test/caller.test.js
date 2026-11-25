'use strict'

const test = require('node:test')
const assert = require('node:assert')
const { execFileSync } = require('node:child_process')
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const proxyquire = require('proxyquire')
const loop = require('./fixtures/caller-loop.js')

test('returns a callstack of absolute paths', () => {
  const callers = loop(7).map(fileName => fileName.substring(__dirname.length))

  // default callstack size is 10, but the top 2 are dropped
  assert.equal(callers.length, 8)
  assert.match(callers[0], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[1], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[2], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[3], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[4], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[5], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[6], /^[/\\]fixtures[/\\]caller-loop\.js$/)
  assert.match(callers[7], /^[/\\]caller\.test\.js$/)
})

test('pino() does not invoke caller() when transport is not configured', () => {
  let called = 0
  const pino = proxyquire('../pino', {
    './lib/caller': () => {
      called++
      return [__filename]
    }
  })

  pino({ level: 'silent' })
  assert.equal(called, 0)
})

test('does not resolve source maps under --enable-source-maps', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pino-caller-sm-'))
  try {
    const jsFile = join(dir, 'entry.cjs')
    const mapFile = join(dir, 'entry.cjs.map')
    const callerPath = JSON.stringify(join(__dirname, '..', 'lib', 'caller.js'))

    writeFileSync(mapFile, JSON.stringify({
      version: 3,
      sources: ['mapped-source.ts'],
      names: [],
      mappings: 'AAAA'
    }))

    writeFileSync(jsFile, [
      `const getCallers = require(${callerPath})`,
      'function run () { return getCallers() }',
      'process.stdout.write(JSON.stringify(run()))',
      '//# sourceMappingURL=entry.cjs.map'
    ].join('\n'))

    const out = execFileSync(process.execPath, ['--enable-source-maps', jsFile], { encoding: 'utf8' })
    const callers = JSON.parse(out)
    assert.equal(callers[0], jsFile)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
