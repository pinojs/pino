const getCallers = require('../../lib/caller.js')

module.exports = function loop (count) {
  if (count <= 0) return getCallers()
  return loop(count - 1)
}
