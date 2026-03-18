'use strict'

const { defineConfig, globalIgnores } = require('eslint/config')
const neostandard = require('neostandard')

module.exports = defineConfig([
  neostandard({
    ts: true
  }),
  globalIgnores([
    'test/fixtures/syntax-error-esm.mjs',
    'test/fixtures/ts/*cjs'
  ]),
  {
    rules: {
      'comma-dangle': ['error', 'never'],
      'no-var': 'off'
    }
  },
  {
    files: ['pino.d.ts'],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  {
    files: ['test/types/**/*'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'n/handle-callback-err': 'off'
    }
  }
])
