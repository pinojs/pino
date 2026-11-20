'use strict'

const getCallers = require('../../lib/caller.js')

// Stands in for pino(): getCallers() drops itself and its direct caller.
function entry () {
  return getCallers()
}

console.log(JSON.stringify(entry()))
// eslint-disable-next-line @stylistic/spaced-comment
//# sourceMappingURL=caller-source-map.js.map
