'use strict'

const { defineConfig, globalIgnores } = require('eslint/config')
const neostandard = require('neostandard')

module.exports = defineConfig([
  neostandard({
    ts: true
  }),
  globalIgnores([
    'pino.d.ts',
    'test/fixtures/syntax-error-esm.mjs',
    'test/fixtures/ts/*cjs',
  ]),
  {
    rules: {
      'no-var': 'off',
    },
  },
  {
    files: ['test/types/**/*'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'n/handle-callback-err': 'off',
    },
  },
])
