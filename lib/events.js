'use strict'

const SonicBoom = require('sonic-boom')
const { onTerminatedSym, streamSym } = require('./symbols')
function events (instance) {
  const stream = instance[streamSym]

  if (stream instanceof SonicBoom === true) {
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
      instance.flush()
    }

    function theWorldIsBurning (err) {
      runInternalHandler()
      handlers.handledOnTerminate = true
      if (isExtreme()) instance[onTerminatedSym](this.name, err)
    }

    function runInternalHandler () {
      if (handlers.handledOnTerminate) return
      stream.flushSync()
    }
    function isExtreme () {
      const stream = instance[streamSym]
      return stream instanceof SonicBoom &&
        stream.minLength > 0
    }

    if (isExtreme()) {
      Object.keys(handlers).forEach((k) => process.on(k, handlers[k]))
    }
  }
}

module.exports = events
