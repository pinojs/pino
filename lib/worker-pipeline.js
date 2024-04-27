'use strict'

const EE = require('events')
const loadTransportStreamBuilder = require('./transport-stream')
const { pipeline, PassThrough } = require('stream')

// This file is not checked by the code coverage tool,
// as it is not reliable.

/* istanbul ignore file */

module.exports = async function ({ targets, pipelines }) {
  if (targets === undefined && pipelines) {
    // Create an instance of ThreadStream using target (worker-pipeline.js) as internal thread worker
  /**
   * In case a pipeline is defined, a single ThreadStream is created as usual
   * representing the PassThrough(stream1 + .. + streamN)
   *
   * If we want to implement a `tee`, the quickest way is to create as many
   * pipelines as paths that can be created from a transport configuration
   * and return a PassThrough stream wrapping all the pass through streams
   * as entry point for each pipeline.
   * // TODO: to rephrase
   *
   * // TODO: propose to deprecate "pipeline" property only
   *
   * Given for example the following transport configuration:
   *
   * const transport = pino.transport({
   *   targets: [
   *     {
   *       // targetA
   *       target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
   *       options: { destination: destinationA }
   *       // An undefined "pipeline" property means do not use a pipeline as source
   *     },
   *     {
   *       // targetB
   *       target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
   *       options: { destination: destinationB },
   *       pipeline: "pipeA" // use pipeA as source
   *     }
   *   ],
   *   pipelines: {
   *    "pipeA": [
   *     {
   *       target: join(__dirname, '..', 'fixtures', 'transport-transform.js'),
   *     }
   *    ]
   *   }
   * })
   *
   * We would have 3 pipelines:
   *
   * 2 actual ones:
   *  p1 = pipeline(passThrough1, pipeA, targetA)
   *  p2 = pipeline(passThrough2, pipeA, targetB)
   *
   * PassThroughEntry // a stream that serves purely as entry point for ThreadStream
   *
   * 1 pipeline
   *  p3 = pipeline(PassThroughEntry, passThrough1, passThrough2)
   *
   * return PassThroughEntry
   */

    const entryStreams = []
    for (let i = 0; i < pipelines.length; i++) {
      const pipelineTargets = pipelines[i]
      const streams = await Promise.all(pipelineTargets.map(async (t) => {
        const fn = await loadTransportStreamBuilder(t.target)
        const stream = await fn(t.options)
        return stream
      }))

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

      entryStreams.push(stream)
    }

    const ee = new EE()
    const sourceStream = new PassThrough({
      autoDestroy: true,
      destroy (_, cb) {
        ee.on('error', cb)
        ee.on('closed', cb)
      }
    })

    pipeline(sourceStream, ...entryStreams, function (err) {
      if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        ee.emit('error', err)
        return
      }

      ee.emit('closed')
    })

    return sourceStream
  } else {
    // Maintaining bakcwards compatibility
    const streams = await Promise.all(targets.map(async (t) => {
      const fn = await loadTransportStreamBuilder(t.target)
      const stream = await fn(t.options)
      return stream
    }))

    if (targets) {
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
}
