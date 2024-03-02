'use strict'

const nodeAssert = require('assert')
const os = require('os')
const split = require('split2')

/**
 * Create a Pino destination stream to easily inspect the logs processed by Pino.
 *
 * @param {object} options The options to be used.
 * @param {boolean} [options.destroyOnError=false] If true, the stream will be destroyed on error.
 * @param {boolean} [options.emitErrorEvent=false] If true, the stream eill emit an error event on error.
 *
 * @returns A stream.
 */
function sink ({ destroyOnError = false, emitErrorEvent = false } = {}) {
  const stream = split((data) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      if (emitErrorEvent) stream.emit('error', err)
      if (destroyOnError) stream.destroy()
    }
  })

  return stream
}

/**
 * Check if the chunk is equal to the expected value.
 *
 * @param {object} chunk The chunk to be tested.
 * @param {object} expected The expected value to be tested.
 * @param {function} assert The assert function to be used.
 *
 * @throws If the expected value is not equal to the chunk value.
 */
function check (chunk, expected, assert) {
  const { time, pid, hostname, ...chunkCopy } = chunk

  assert(new Date(time) <= new Date(), true, 'time is greater than Date.now()')
  assert(pid, process.pid)
  assert(hostname, os.hostname())
  assert(chunkCopy, expected)
}

/**
 * Assert that a single log is expected.
 *
 * @param {import('node:stream').Transform} stream The stream to be tested.
 * @param {object} expected The expected value to be tested.
 * @param {function} [assert=nodeAssert.deepStrictEqual] The assert function to be used.
 *
 * @returns A promise that resolves when the expected value is equal to the stream value.
 * @throws If the expected value is not equal to the stream value.
 *
 * @example
 * const stream = pino.test.sink()
 * const logger = pino(stream)
 * logger.info('hello world')
 * const expected = { msg: 'hello world', level: 30 }
 * await pino.test.once(stream, expected)
 */
async function once (stream, expected, assert = nodeAssert.deepStrictEqual) {
  return new Promise((resolve, reject) => {
    const dataHandler = (data) => {
      stream.removeListener('error', reject)
      stream.removeListener('data', dataHandler)
      try {
        check(data, expected, assert)
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    stream.once('error', reject)
    stream.once('data', dataHandler)
  })
}

/**
 * Assert that consecutive logs are expected.
 *
 * @param {import('node:stream').Transform} stream The stream to be tested.
 * @param {object} expected The expected value to be tested.
 * @param {function} [assert=nodeAssert.deepStrictEqual] The assert function to be used.
 *
 * @returns A promise that resolves when the expected value is equal to the stream value.
 * @throws If the expected value is not equal to the stream value.
 *
 * @example
 * const stream = pino.test.sink()
 * const logger = pino(stream)
 * logger.info('hello world')
 * logger.info('hi world')
 * const expected = [
 *   { msg: 'hello world', level: 30 },
 *   { msg: 'hi world', level: 30 }
 * ]
 * await pino.test.consecutive(stream, expected)
 */
async function consecutive (stream, expected, assert = nodeAssert.deepStrictEqual) {
  let i = 0
  for await (const chunk of stream) {
    check(chunk, expected[i], assert)
    i++
    if (i === expected.length) break
  }
}

module.exports = { sink, once, consecutive }
