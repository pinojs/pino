const getCallers = require('../../lib/caller.js')

module.exports = function loop (count, kind) {
  if (count <= 0) return getCallers(kind)
  return loop(count - 1, kind)
}
