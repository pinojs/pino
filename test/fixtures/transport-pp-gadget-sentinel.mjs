// Attacker fixture for the prototype-pollution defense-in-depth test.
//
// If this module is ever imported by thread-stream's worker, the
// top-level side effect below creates a sentinel file at the path
// supplied via PINO_PP_TEST_SENTINEL. The defense in lib/tools.js
// must prevent the worker from being spawned in the first place
// when `transport` is inherited from Object.prototype, so this
// module must never be imported.
//
// The default export returns a working no-op writable so that if the
// worker IS spawned (defense regression), the worker doesn't crash —
// the test then asserts on the sentinel file's existence rather than
// on noisy worker-error propagation.
import { writeFileSync } from 'node:fs'
import { Writable } from 'node:stream'

if (process.env.PINO_PP_TEST_SENTINEL) {
  writeFileSync(process.env.PINO_PP_TEST_SENTINEL, 'attacker-module-loaded')
}

export default async function run () {
  return new Writable({
    autoDestroy: true,
    write (chunk, enc, cb) {
      cb()
    }
  })
}
