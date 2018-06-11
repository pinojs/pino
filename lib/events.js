'use strict'

const SonicBoom = require('sonic-boom')

module.exports = function (pinoInstance) {
  const { stream } = pinoInstance

  if (stream instanceof SonicBoom) {
    if (stream.fd === -1) {
      stream.on('ready', register)
    } else {
      register()
    }
  }

  function register () {
    const wrap = (name) => theWorldIsBurning.bind({ name })

    const handlers = {
      beforeExit: wrap('beforeExit'),
      uncaughtException: wrap('uncaughtException'),
      SIGHUP: hup,
      SIGINT: wrap('SIGINT'),
      SIGQUIT: wrap('SIGQUIT'),
      SIGTERM: wrap('SIGTERM')
    }

    process.on('exit', wrap('exit'))

    function hup () {
      if (process.listenerCount('SIGHUP') === 1) {
        return theWorldIsBurning.call({name: 'SIGHUP'})
      }
      pinoInstance.flush()
    }

    function theWorldIsBurning (err) {
      runInternalHandler()
      handlers.handledOnTerminate = true
      if (isExtreme()) pinoInstance.onTerminated(this.name, err)
    }

    function runInternalHandler () {
      if (handlers.handledOnTerminate) return
      stream.flushSync()
    }
    function isExtreme () {
      return pinoInstance.stream instanceof SonicBoom &&
        pinoInstance.stream.minLength > 0
    }

    if (isExtreme()) {
      Object.keys(handlers).forEach((k) => process.on(k, handlers[k]))
    }
  }
}
