'use strict'

const warning = require('process-warning')

/**
 * Future flags, specific to the current major-version of Pino. These flags allow for breaking-changes to be introduced
 * on a opt-in basis, anticipating behavior of the next major-version. All future flag must be frozen as false. These
 * future flags are specific to Pino major-version 9.
 */
const future = Object.freeze({
  skipUnconditionalStdSerializers: false // see PINODEP010
})

const PINODEP010 = warning.createDeprecation({ code: 'PINODEP010', message: 'Unconditional execution of standard serializers for HTTP Request and Response will be discontinued in the next major version.' })

module.exports = {
  warning: {
    PINODEP010
  },
  future
}
