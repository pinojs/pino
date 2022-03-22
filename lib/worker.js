'use strict'

const pino = require('../pino.js')
const build = require('pino-abstract-transport')
const { realImport, realRequire } = require('real-require')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

module.exports = async function ({ targets, levels }) {
  targets = await Promise.all(targets.map(async (t) => {
    let fn
    try {
      const toLoad = 'file://' + t.target

      if (toLoad.endsWith('.ts') || toLoad.endsWith('.cts')) {
        // TODO: add support for the TSM modules loader ( https://github.com/lukeed/tsm ).
        if (process[Symbol.for('ts-node.register.instance')]) {
          realRequire('ts-node/register')
        } else if (process.env && process.env.TS_NODE_DEV) {
          realRequire('ts-node-dev')
        }
        // TODO: Support ES imports once tsc, tap & ts-node provide better compatibility guarantees.
        fn = realRequire(decodeURIComponent(t.target))
      } else {
        fn = (await realImport(toLoad))
      }
    } catch (error) {
      // See this PR for details: https://github.com/pinojs/thread-stream/pull/34
      if ((error.code === 'ENOTDIR' || error.code === 'ERR_MODULE_NOT_FOUND')) {
        fn = realRequire(t.target)
      } else {
        throw error
      }
    }

    // Depending on how the default export is performed, and on how the code is
    // transpiled, we may find cases of two nested "default" objects.
    // See https://github.com/pinojs/pino/issues/1243#issuecomment-982774762
    if (typeof fn === 'object') fn = fn.default
    if (typeof fn === 'object') fn = fn.default

    const stream = await fn(t.options)
    return {
      level: t.level,
      stream
    }
  }))
  return build(process, {
    parse: 'lines',
    metadata: true,
    close (err, cb) {
      let expected = 0
      for (const transport of targets) {
        expected++
        transport.stream.on('close', closeCb)
        transport.stream.end()
      }

      function closeCb () {
        if (--expected === 0) {
          cb(err)
        }
      }
    }
  })

  function process (stream) {
    const multi = pino.multistream(targets, { levels })
    // TODO manage backpressure
    stream.on('data', function (chunk) {
      const { lastTime, lastMsg, lastObj, lastLevel } = this
      multi.lastLevel = lastLevel
      multi.lastTime = lastTime
      multi.lastMsg = lastMsg
      multi.lastObj = lastObj

      // TODO handle backpressure
      multi.write(chunk + '\n')
    })
  }
}
