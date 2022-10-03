'use strict'

const { realImport, realRequire } = require('real-require')

module.exports = loadTransportStreamBuilder

/**
 * Loads & returns a function to build transport streams
 * @param {string} target
 * @returns {function(object): Promise<import('stream').Writable>}
 * @throws {Error} In case the target module does not export a function
 */
async function loadTransportStreamBuilder (target) {
  let fn
  try {
    const toLoad = 'file://' + target

    if (toLoad.endsWith('.ts') || toLoad.endsWith('.cts')) {
      // TODO: add support for the TSM modules loader ( https://github.com/lukeed/tsm ).
      if (process[Symbol.for('ts-node.register.instance')]) {
        realRequire('ts-node/register')
      } else if (process.env && process.env.TS_NODE_DEV) {
        realRequire('ts-node-dev')
      }
      // TODO: Support ES imports once tsc, tap & ts-node provide better compatibility guarantees.
      fn = realRequire(decodeURIComponent(target))
    } else {
      fn = (await realImport(toLoad))
    }
  } catch (error) {
    // See this PR for details: https://github.com/pinojs/thread-stream/pull/34
    if ((error.code === 'ENOTDIR' || error.code === 'ERR_MODULE_NOT_FOUND')) {
      fn = realRequire(target)
    } else if (error.code === undefined) {
      // When bundled with pkg, an undefined error is thrown when called with realImport
      fn = realRequire(decodeURIComponent(target))
    } else {
      throw error
    }
  }

  // Depending on how the default export is performed, and on how the code is
  // transpiled, we may find cases of two nested "default" objects.
  // See https://github.com/pinojs/pino/issues/1243#issuecomment-982774762
  if (typeof fn === 'object') fn = fn.default
  if (typeof fn === 'object') fn = fn.default
  if (typeof fn !== 'function') throw Error('exported worker is not a function')

  return fn
}
