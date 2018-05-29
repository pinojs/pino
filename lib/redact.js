'use strict'

const fastRedact = require('fast-redact')
const { rx, validator } = fastRedact

const validate = validator({
  ERR_CENSOR_MUST_NOT_BE_FUNCTION: () => 'pino – censor option may not be a function',
  ERR_PATHS_MUST_BE_STRINGS: () => 'pino – redacted paths must be strings',
  ERR_INVALID_PATH: (s) => `pino – redact paths array contains an invalid path (${s})`
})

// symbol for private use
const format = Symbol('pino.format')

const CENSOR = '[Redacted]'

redact.format = format

module.exports = redact

function redact (opts, serialize) {
  const { paths, censor } = handle(opts)

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

function handle (opts) {
  if (Array.isArray(opts)) {
    opts = {paths: opts, censor: CENSOR}
    validate(opts)
    return opts
  }
  var { paths, censor = CENSOR, remove } = opts
  if (Array.isArray(paths) === false) { throw Error('pino – redact must contain an array of strings') }
  if (remove === true) censor = undefined
  validate({paths, censor})

  return {paths, censor}
}
