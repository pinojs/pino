'use strict'

const assert = require('assert')
const os = require('os')
const split = require('split2')
const pid = process.pid
const hostname = os.hostname()

function sink () {
  return split((data) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
}

function check (chunk, expected, is) {
  is(new Date(chunk.time) <= new Date(), true, 'time is greater than Date.now()')
  delete chunk.time
  is(chunk.pid, pid)
  is(chunk.hostname, hostname)
  delete chunk.pid
  delete chunk.hostname

  is(chunk, expected)
}

async function once (stream, expected, is = assert.deepStrictEqual) {
  return new Promise((resolve, reject) => {
    stream.once('error', reject)
    stream.once('data', (...args) => {
      stream.removeListener('error', reject)
      check(...args, expected, is)
      resolve()
    })
  })
}

async function consecutive (stream, expected, is = assert.deepStrictEqual) {
  let i = 0
  for await (const chunk of stream) {
    check(chunk, expected[i], is)
    i++
    if (i === expected.length) break
  }
}

module.exports = { sink, once, consecutive }
