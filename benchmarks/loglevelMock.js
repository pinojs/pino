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

  var originalFactory = loglevel.methodFactory
  loglevel.methodFactory = function (methodName, logLevel, loggerName) {
    var rawMethod = originalFactory(methodName, logLevel, loggerName)

    return function () {
      var time = new Date()
      var array
      if (typeof arguments[0] === 'string') {
        arguments[0] = '[' + time.toISOString() + '] ' + arguments[0]
        rawMethod.apply(null, arguments)
      } else {
        array = new Array(arguments.length + 1)
        array[0] = '[' + time.toISOString() + ']'
        for (var i = 0; i < arguments.length; i++) {
          array[i + 1] = arguments[i]
        }
        rawMethod.apply(null, array)
      }
    }
  }

  loglevel.setLevel(loglevel.levels.INFO)
  return loglevel
}

module.exports = build

if (require.main === module) {
  var loglevel = build(process.stdout)
  loglevel.info('hello')
  loglevel.info({ hello: 'world' })
  loglevel.info('hello %j', { hello: 'world' })
}
