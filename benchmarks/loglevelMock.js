'use strict'

var fs = require('fs')
var vm = require('vm')
var path = require('path')
var code = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'loglevel', 'lib', 'loglevel.js'))
var Console = require('console').Console

function build (dest) {
  var sandbox = {
    module: {},
    console: new Console(dest, dest)
  }
  var context = vm.createContext(sandbox)

  var script = new vm.Script(code)
  script.runInContext(context)

  var loglevel = sandbox.log
  loglevel.setLevel(loglevel.levels.INFO)
  return loglevel
}

module.exports = build

if (require.main === module) {
  var loglevel = build(process.stdout)
  loglevel.info('hello')
}
