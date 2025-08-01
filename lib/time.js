'use strict'

const nullTime = () => ''

const epochTime = () => `,"time":${Date.now()}`

const unixTime = () => `,"time":${Math.round(Date.now() / 1000.0)}`

const isoTime = () => `,"time":"${new Date(Date.now()).toISOString()}"` // using Date.now() for testability

const startWallTimeNs = BigInt(Date.now()) * 1_000_000n
const startHRTimeNs = process.hrtime.bigint()

const NS_MULTIPLIER = 1000
const NS_DIVISOR = 1_000_000_000n

const isoTimeNanos = () => {
  const totalNs = startWallTimeNs + (process.hrtime.bigint() - startHRTimeNs)
  const iso = new Date(Number(totalNs / NS_DIVISOR) * NS_MULTIPLIER).toISOString()
  return `,"time":"${iso.slice(0, 19)}.${(totalNs % NS_DIVISOR).toString().padStart(9, '0')}Z"`
}

module.exports = { nullTime, epochTime, unixTime, isoTime, isoTimeNanos }
