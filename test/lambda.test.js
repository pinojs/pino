'use strict'

// hack, we are on lambda now
process.env.LAMBDA_TASK_ROOT = __dirname

const t = require('tap')
const pino = require('..')
const { symbols } = pino

const logger = pino()

// this test verifies that the default constructor of pino
// does not use SonicBoom on lambda by default

t.equal(logger[symbols.streamSym], process.stdout)
