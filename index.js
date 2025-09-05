const { isBare } = require('which-runtime')
if (isBare) require('bare-process/global')

module.exports = require('./pino', { with: { imports: './package.json' } })
