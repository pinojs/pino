'use strict'
Object.freeze(console)
const test = require('node:test')
const pino = require('../browser')

test('silent level', (_, end) => {
  pino({
    level: 'silent',
    browser: { }
  })
  end()
})
