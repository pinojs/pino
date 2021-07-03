'use strict'

const { test } = require('tap')
const proxyquire = require('proxyquire')
const Writable = require('stream').Writable

test('pretty-target mocked', async function ({ equal, same, plan, pass }) {
  plan(3)
  let ret
  const prettyTarget = proxyquire('../lib/pretty-target', {
    '../pino': {
      destination (opts) {
        same(opts, { dest: 1, sync: false })

        ret = new Writable()
        ret.fd = opts.dest

        process.nextTick(() => {
          ret.emit('ready')
        })

        Object.defineProperty(ret, 'end', {
          get () {
            return 'unused'
          },
          set (end) {
            pass('prop set')
            const obj = {
              emit (ev) {
                equal(ev, 'close')
              },
              end
            }
            obj.end()
          }
        })
        return ret
      }
    }
  })

  await prettyTarget()
})

test('file-target mocked', async function ({ equal, same, plan, pass }) {
  plan(1)
  let ret
  const fileTarget = proxyquire('../lib/file-target', {
    '../pino': {
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
