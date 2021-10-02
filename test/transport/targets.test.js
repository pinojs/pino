'use strict'

const { test } = require('tap')
const proxyquire = require('proxyquire')
const Writable = require('stream').Writable

test('file-target mocked', async function ({ equal, same, plan, pass }) {
  plan(1)
  let ret
  const fileTarget = proxyquire('../../file', {
    './pino': {
      destination (opts) {
        same(opts, { dest: 1, sync: false })

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
