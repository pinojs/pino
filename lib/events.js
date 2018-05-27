'use strict'

const SonicBoom = require('sonic-boom')

module.exports = function (pinoInstance, internalExtremeHandler) {
  function isExtreme () {
    return pinoInstance.stream instanceof SonicBoom && pinoInstance.stream.minLength > 0
  }

  function theWorldIsBurning (err) {
    runInternalHandler()
    handlers.handledOnTerminate = true
    if (isExtreme()) {
      pinoInstance.onTerminated(this.name, err)
    }
  }

  function hup () {
    if (process.listenerCount('SIGHUP') === 1) {
      return theWorldIsBurning.call({name: 'SIGHUP'})
    }
    pinoInstance.flush()
  }

  function runInternalHandler () {
    if (handlers.handledOnTerminate) return
    internalExtremeHandler()
  }

  process.on('exit', wrap('exit'))

  var handlers = {
    beforeExit: wrap('beforeExit'),
    uncaughtException: wrap('uncaughtException'),
    SIGHUP: hup,
    SIGINT: wrap('SIGINT'),
    SIGQUIT: wrap('SIGQUIT'),
    SIGTERM: wrap('SIGTERM')
  }

  if (isExtreme()) {
    Object.keys(handlers).forEach(function (k) {
      process.on(k, handlers[k])
    })
  }

  return handlers

  function wrap (name) {
    return theWorldIsBurning.bind({ name })
  }
}
