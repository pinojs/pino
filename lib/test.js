'use strict'

const assert = require('assert')
const os = require('os')
const split = require('split2')

/**
 * Create a Pino destination stream to easily inspect the logs processed by Pino.
 * @param [options]: The object options to control the behavior of the stream when an error happen. Default: { destroyOnError: false, emitErrorEvent: false }
 * @returns {import('node:stream').Transform} A Transform stream to be used as destination for the pino function
 * @example
 * const stream = pino.test.sink()
 * const logger = pino(stream)
 * logger.info('hello world')
 * stream.once('data', (chunk) => {
 *  console.log(chunk.msg) // 'hello world'
 *  console.log(chunk.level) // 30
 * })
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
 * @param {object} chunk: The chunk to be tested
 * @param {object} expected: The expected value to be tested
 * @param {assert.deepStrictEqual} is: The assert function to be used.
 * @throws If the expected value is not equal to the chunk value
 */
function check (chunk, expected, is) {
  const { time, pid, hostname, ...chunkCopy } = chunk

  is(new Date(time) <= new Date(), true, 'time is greater than Date.now()')
  is(pid, process.pid)
  is(hostname, os.hostname())
  is(chunkCopy, expected)
}

/**
 * Assert that a single log is expected.
 * @param {import('node:stream').Transform} stream: The stream to be tested
 * @param {object} expected: The expected value to be tested
 * @param {assert.deepStrictEqual} [assert]: The assert function to be used. Default: deepStrictEqual
 * @returns A promise that resolves when the expected value is equal to the stream value
 * @throws If the expected value is not equal to the stream value
 * @example
 * const stream = pino.test.sink()
 * const logger = pino(stream)
 * logger.info('hello world')
 * const expected = { msg: 'hello world', level: 30 }
 * await pino.test.once(stream, expected)
 */
async function once (stream, expected, is = assert.deepStrictEqual) {
  return new Promise((resolve, reject) => {
    const dataHandler = (data) => {
      stream.removeListener('error', reject)
      stream.removeListener('data', dataHandler)
      try {
        check(data, expected, is)
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
 * @param {import('node:stream').Transform} stream: The stream to be tested
 * @param {object} expected: The expected value to be tested
 * @param {assert.deepStrictEqual} [assert]: The assert function to be used. Default: deepStrictEqual
 * @returns A promise that resolves when the expected value is equal to the stream value
 * @throws If the expected value is not equal to the stream value
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
async function consecutive (stream, expected, is = assert.deepStrictEqual) {
  let i = 0
  for await (const chunk of stream) {
    check(chunk, expected[i], is)
    i++
    if (i === expected.length) break
  }
}

module.exports = { sink, once, consecutive }
