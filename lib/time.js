'use strict'

const nullTime = () => ''

const epochTime = () => `,"time":${Date.now()}`

const unixTime = () => `,"time":${Math.round(Date.now() / 1000.0)}`

const isoTime = () => `,"time":"${new Date(Date.now()).toISOString()}"` // using Date.now() for testability

const NS_PER_MS = 1_000_000n
const NS_PER_SEC = 1_000_000_000n

const startWallTimeNs = BigInt(Date.now()) * NS_PER_MS
const startHrTime = process.hrtime.bigint()

const isoTimeNanos = () => {
  const elapsedNs = process.hrtime.bigint() - startHrTime
  const currentTimeNs = startWallTimeNs + elapsedNs

  const millisPart = currentTimeNs / NS_PER_MS
  const nanosPart = currentTimeNs % NS_PER_SEC

  const isoDate = new Date(Number(secondsPart)).toISOString().slice(0, 19)

  return `,"time":"${isoDate}.${nanosPart.toString().padStart(9, '0')}Z"`
}

module.exports = { nullTime, epochTime, unixTime, isoTime, isoTimeNanos }
