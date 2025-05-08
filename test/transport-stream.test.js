'use strict'

const { test } = require('node:test')
const { mock } = require('cjs-mock')

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

  /** @type {typeof import('../lib/transport-stream.js')} */
  const loadTransportStreamBuilder = mock('../lib/transport-stream.js', { 'real-require': { realRequire: mockRealRequire, realImport: mockRealImport } })

  const fn = await loadTransportStreamBuilder('pino-pretty')

  t.assert.doesNotThrow(() => fn())
})
