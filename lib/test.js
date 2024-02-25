'use strict'

const assert = require('assert')
const os = require('os')
const split = require('split2')

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

function check (chunk, expected, is) {
  const { time, pid, hostname, ...chunkCopy } = chunk

  is(new Date(time) <= new Date(), true, 'time is greater than Date.now()')
  is(pid, process.pid)
  is(hostname, os.hostname())
  is(chunkCopy, expected)
}

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

async function consecutive (stream, expected, is = assert.deepStrictEqual) {
  let i = 0
  for await (const chunk of stream) {
    check(chunk, expected[i], is)
    i++
    if (i === expected.length) break
  }
}

module.exports = { sink, once, consecutive }
