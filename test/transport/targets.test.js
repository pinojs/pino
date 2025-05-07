'use strict'

const { test } = require('node:test')
const { join } = require('node:path')
const proxyquire = require('proxyquire')
const Writable = require('node:stream').Writable
const pino = require('../../pino')

test('file-target mocked', async (t) => {
  t.plan(1)
  let ret
  const fileTarget = proxyquire('../../file', {
    './pino': {
      destination (opts) {
        t.assert.deepStrictEqual(opts, { dest: 1, sync: false })

        ret = new Writable()
        ret.fd = opts.dest

        process.nextTick(() => {
          ret.emit('ready')
        })

        return ret
      }
    }
  })

  await fileTarget()
})

test('pino.transport with syntax error', (t, end) => {
  t.plan(1)
  const transport = pino.transport({
    targets: [{
      target: join(__dirname, '..', 'fixtures', 'syntax-error-esm.mjs')
    }]
  })
  t.after(transport.end.bind(transport))

  transport.on('error', (err) => {
    t.assert.deepStrictEqual(err, new SyntaxError('Unexpected end of input'))
    end()
  })
})
