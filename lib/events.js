'use strict'

module.exports = function (pinoInstance, internalExtremeHandler) {
  function theWorldIsBurning (err) {
    runInternalHandler()
    handlers.handledOnTerminate = true
    pinoInstance.onTerminated(this.name, err)
  }

  function runInternalHandler () {
    if (handlers.handledOnTerminate) return
    internalExtremeHandler()
  }

  var handlers = {
    beforeExit: theWorldIsBurning.bind({name: 'beforeExit'}),
    exit: theWorldIsBurning.bind({name: 'exit'}),
    uncaughtException: theWorldIsBurning.bind({name: 'uncaughtException'}),
    SIGHUP: theWorldIsBurning.bind({name: 'SIGHUP'}),
    SIGINT: theWorldIsBurning.bind({name: 'SIGINT'}),
    SIGQUIT: theWorldIsBurning.bind({name: 'SIGQUIT'}),
    SIGTERM: theWorldIsBurning.bind({name: 'SIGTERM'})
  }

  Object.keys(handlers).forEach(function (k) {
    process.on(k, handlers[k])
  })

  return handlers
}
