'use strict'

const { test } = require('node:test')

test('should import', async (t) => {
  t.plan(2)
  const mockRealRequire = (target) => {
    return {
      default: {
        default: () => {
          t.assert.strictEqual(target, 'pino-pretty')
          return Promise.resolve()
        }
      }
    }
  }
  const mockRealImport = async () => { await Promise.resolve(); throw Object.assign(new Error(), { code: 'ERR_MODULE_NOT_FOUND' }) }
  const loadTransportStreamBuilder = require('../lib/transport-stream.js')

  const fn = await loadTransportStreamBuilder('pino-pretty', { realImport: mockRealImport, realRequire: mockRealRequire })

  t.assert.doesNotThrow(() => fn())
})
