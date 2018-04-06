'use strict'

module.exports = function (pinoInstance, internalExtremeHandler) {
  function theWorldIsBurning (err) {
    runInternalHandler()
    handlers.handledOnTerminate = true
    pinoInstance.onTerminated(this.name, err)
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

  var handlers = {
    beforeExit: theWorldIsBurning.bind({name: 'beforeExit'}),
    exit: theWorldIsBurning.bind({name: 'exit'}),
    uncaughtException: theWorldIsBurning.bind({name: 'uncaughtException'}),
    SIGHUP: hup,
    SIGINT: theWorldIsBurning.bind({name: 'SIGINT'}),
    SIGQUIT: theWorldIsBurning.bind({name: 'SIGQUIT'}),
    SIGTERM: theWorldIsBurning.bind({name: 'SIGTERM'})
  }

  Object.keys(handlers).forEach(function (k) {
    process.on(k, handlers[k])
  })

  return handlers
}
