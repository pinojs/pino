'use strict'

const EE = require('events')
const { pipeline, PassThrough } = require('stream')
const pino = require('../pino.js')
const build = require('pino-abstract-transport')
const loadTransportStreamBuilder = require('./transport-stream')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

// The worker flow can be schematized as follows
//
// ┌──────────────────────────────────────────────────┐   ┌─────┐
// │                                                  │   │     │
// │                                                  │   │  p  │
// │                   target    ┌───────────────┐    │   │  i  │
// │                 ──────────► │               │    │   │  n  │
// │   targets         target    │  pino.        │    │   │  o  │
// │ ────────────►   ──────────► │  multistream  ├────┼──►│  .  │       source
// │                   target    │               │    │   │  m  │         │
// │                 ──────────► └───────────────┘    │   │  u  │         │write
// │                                                  │   │  l  │         ▼
// │                  pipeline   ┌───────────────┐    │   │  t  │      ┌────────┐
// │                 ──────────► │ PassThrough   ├────┼──►│  i  ├──────┤        │
// │                             └───────────────┘    │   │  s  │ write│ Thread │
// │                                                  │   │  t  │◄─────┤ Stream │
// │                  pipeline   ┌───────────────┐    │   │  r  │      │        │
// │                 ──────────► │ PassThrough   ├────┼──►│  e  │      └────────┘
// │                             └───────────────┘    │   │  a  │
// │                                                  │   │  m  │
// │                                                  │   │     │
// │                        OR                        │   │     │
// │                                                  │   │     │
// │  pipeline     ┌──────────────┐                   │   │     │
// │ ────────────► │ PassThrough  ├───────────────────┼──►│     │
// │               └──────────────┘                   │   │     │
// │                                                  │   │     │
// └──────────────────────────────────────────────────┘   └─────┘

module.exports = async function ({ targets, pipelines, levels, dedupe }) {
  const targetStreams = []

  // Process targets
  if (targets) {
    targets = await Promise.all(targets.map(async (t) => {
      const fn = await loadTransportStreamBuilder(t.target)
      const stream = await fn(t.options)
      return {
        level: t.level,
        stream
      }
    }))

    targetStreams.push(...targets)
  }

  // Process pipelines
  if (pipelines) {
    pipelines = await Promise.all(
      pipelines.map(async (p) => {
        const pipeDests = await Promise.all(
          p.map(async (t) => {
            const fn = await loadTransportStreamBuilder(t.target)
            const stream = await fn(t.options)
            return stream
          }
          ))

        return { stream: createPipeline(pipeDests) }
      })
    )
    targetStreams.push(...pipelines)
  }

  return build(process, {
    parse: 'lines',
    metadata: true,
    close (err, cb) {
      let expected = 0
      for (const transport of targetStreams) {
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

  // TODO: Why split2 was not used for pipelines?
  function process (stream) {
    const multi = pino.multistream(targetStreams, { levels, dedupe })
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

  /**
 * Creates a pipeline using the provided streams and return an instance of `PassThrough` stream
 * as a source for the pipeline.
 *
 * @param {(TransformStream|WritableStream)[]} streams An array of streams.
 *   All intermediate streams in the array *MUST* be `Transform` streams and only the last one `Writable`.
 * @returns A `PassThrough` stream instance representing the source stream of the pipeline
 */
  function createPipeline (streams) {
    const ee = new EE()
    const stream = new PassThrough({
      autoDestroy: true,
      destroy (_, cb) {
        ee.on('error', cb)
        ee.on('closed', cb)
      }
    })

    pipeline(stream, ...streams, function (err) {
      if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        ee.emit('error', err)
        return
      }

      ee.emit('closed')
    })

    return stream
  }
}
