'use strict'

const nullTime = () => ''

const epochTime = (timestampKey) => `,"${timestampKey}":${Date.now()}`

const unixTime = (timestampKey) => `,"${timestampKey}":${Math.round(Date.now() / 1000.0)}`

module.exports = { nullTime, epochTime, unixTime }
