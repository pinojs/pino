/**
 * @enum {number}
 */
const DEFAULT_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
}

/**
 * @enum {"ASC" | "DESC"}
 */
const SORTING_ORDER = {
  ASC: 'ASC',
  DESC: 'DESC'
}

module.exports = {
  DEFAULT_LEVELS,
  SORTING_ORDER
}
