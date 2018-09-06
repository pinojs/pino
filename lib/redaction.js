'use strict'

const fastRedact = require('fast-redact')
const { redactFmtSym } = require('./symbols')
const { rx, validator } = fastRedact

const validate = validator({
  ERR_CENSOR_MUST_NOT_BE_FUNCTION: () => 'pino – censor option may not be a function',
  ERR_PATHS_MUST_BE_STRINGS: () => 'pino – redacted paths must be strings',
  ERR_INVALID_PATH: (s) => `pino – redact paths array contains an invalid path (${s})`
})

const CENSOR = '[Redacted]'
const strict = false // TODO should this be configurable?

function redaction (opts, serialize) {
  const { paths, censor } = handle(opts)

  const shape = paths.reduce((o, str) => {
    rx.lastIndex = 0
    rx.exec(str)
    const next = rx.exec(str)
    // top level key:
    if (next === null) {
      o[str] = null
      return o
    }
    const { index } = next
    const firstPosBracket = str[index - 1] === '['
    const leadingChar = firstPosBracket ? '[' : ''
    const ns = str.substr(0, index - 1).replace(/^\["(.+)"\]$/, '$1')
    o[ns] = o[ns] || []
    o[ns].push(`${leadingChar}${str.substr(index, str.length - 1)}`)
    return o
  }, {})

  // the redactor assigned to the format symbol key
  // provides top level redaction for instances where
  // an object is interpolated into the msg string
  const result = {
    [redactFmtSym]: fastRedact({ paths, censor, serialize, strict })
  }
  const serializedCensor = serialize(censor)
  const topCensor = () => serializedCensor
  return Object.keys(shape).reduce((o, k) => {
    // top level key:
    if (shape[k] === null) o[k] = topCensor
    else o[k] = fastRedact({ paths: shape[k], censor, serialize, strict })
    return o
  }, result)
}

function handle (opts) {
  if (Array.isArray(opts)) {
    opts = { paths: opts, censor: CENSOR }
    validate(opts)
    return opts
  }
  var { paths, censor = CENSOR, remove } = opts
  if (Array.isArray(paths) === false) { throw Error('pino – redact must contain an array of strings') }
  if (remove === true) censor = undefined
  validate({ paths, censor })

  return { paths, censor }
}

module.exports = redaction
