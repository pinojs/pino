'use strict'

const { test } = require('node:test')
const proxyquire = require('proxyquire')

test('pino.transport resolves targets in REPL', async (t) => {
  // Arrange
  const transport = proxyquire('../../lib/transport', {
    './caller': () => ['node:repl']
  })

  // Act / Assert
  t.assert.doesNotThrow(() => transport({ target: 'pino-pretty' }))
})
