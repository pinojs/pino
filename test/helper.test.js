'use strict'

const { test } = require('tap')
const { expected } = require('./helper')

test('test helper expected to receive string and list of elements to match', async ({ is }) => {
  var str = '[1459875739796] WARN : pino.final with prettyPrint does not support flushing [1459875739796] INFO  (123456 on abcdefghijklmnopqr): beforeExit'
  var s$ = [
    'pino.final',
    'prettyPrint',
    'beforeExit',
    '123456',
    'abcdefghijklmnopqr',
    'WARN',
    'INFO'
  ]
  is(expected(str).output({ has: s$ }), true)
})
test('test helper expected to receive string and list of elements to not match', async ({ is }) => {
  var str = '[1459875739796] WARN : pino.final with prettyPrint does not support flushing [1459875739796] INFO  (123456 on abcdefghijklmnopqr): beforeExit'
  var s$ = [
    '!pino.final',
    '!prettyPrint',
    '!beforeExit',
    '!123456',
    '!abcdefghijklmnopqr',
    '!WARN',
    '!INFO'
  ]
  is(expected(str).output({ has: s$ }), false)
})
test('test helper expected to receieve empty value to not throw error', async ({ is }) => {
  var str = ''
  var s$ = [
    'pino.final',
    'prettyPrint',
    'beforeExit',
    '123456',
    'abcdefghijklmnopqr',
    'WARN',
    'INFO'
  ]
  is(expected(str).output({ has: s$ }), undefined)
})
test('test helper expected to receieve non-array/list to not throw error', async ({ is }) => {
  var str = '[1459875739796] WARN : pino.final with prettyPrint does not support flushing [1459875739796] INFO  (123456 on abcdefghijklmnopqr): beforeExit'
  var s$ = ''
  is(expected(str).output({ has: s$ }), undefined)
})
