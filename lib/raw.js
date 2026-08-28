'use strict'

const rawJSONSym = Symbol('pino.rawJSON')

function raw (value) {
  if (typeof value !== 'string') {
    throw new TypeError(`pino.raw() expects a pre-serialized JSON string, received ${typeof value}`)
  }

  return { [rawJSONSym]: value }
}

module.exports = {
  raw,
  rawJSONSym
}
