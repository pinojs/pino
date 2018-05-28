'use strict'

const fastRedact = require('fast-redact')
const { rx, validator } = fastRedact

const validate = validator({
  ERR_CENSOR_MUST_BE_FUNCTION: () => 'pino – censor option may not be a function',
  ERR_PATHS_MUST_BE_STRINGS: () => 'pino – redact option must be an array of strings',
  ERR_INVALID_PATH: (s) => `pino – redact array contains an invalid path (${s})`
})

// symbol for private use
const format = Symbol('pino.format')

redact.format = format

module.exports = redact

function redact ({paths, censor, serialize}) {
  assertValid(paths, censor)

  const shape = paths.reduce((o, str) => {
    rx.lastIndex = 0
    rx.exec(str)
    const { index } = rx.exec(str)
    o[str.substr(0, index - 1)] = o[str.substr(0, index - 1)] || []
    o[str.substr(0, index - 1)].push(str.substr(index, str.length - 1))
    return o
  }, {})

  // the redactor assigned to the format symbol key
  // provides top level redaction for instances where
  // an object is interpolated into the msg string
  const result = {
    [format]: fastRedact({paths, censor, serialize})
  }

  return Object.keys(shape).reduce((o, k) => {
    o[k] = fastRedact({paths: shape[k], censor, serialize})
    return o
  }, result)
}

function assertValid (paths, censor) {
  if (Array.isArray(paths) === false) { throw Error('pino – redact option must be an array of strings') }
  validate({paths, censor})
}
