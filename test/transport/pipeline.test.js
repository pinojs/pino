'use strict'

const os = require('os')
const { join } = require('path')
const { readFile } = require('fs').promises
const { watchFileCreated, file } = require('../helper')
const { test } = require('tap')
const pino = require('../../')

const { pid } = process
const hostname = os.hostname()

/**
 * The idea to address the requirement of mix&match target and pipeline
 * https://github.com/pinojs/pino/issues/1302
 * is to implement a sort of `tee`.
 * Targets defined in `pipelines` property will be used to generate
 * an output value which will be then written to different end targets.
 *
 */
test('pino.transport with a pipeline', async ({ same, teardown }) => {
  const destination = file()
  const transport = pino.transport({
    pipeline: [{
      target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
    }, {
      target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
      options: { destination }
    }]
  })
  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destination)
  const result = JSON.parse(await readFile(destination))
  delete result.time
  same(result, {
    pid,
    hostname,
    level: 30,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
})

test('pino.transport with targets using a shared pipeline', async ({ same, teardown }) => {
  const destinationA = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const destinationB = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    targets: [
      {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: destinationA },
        pipeline: 'pipelineA'
      },
      {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: destinationB },
        pipeline: 'pipelineA'
      }
    ],
    pipelines: {
      pipelineA: [
        {
          target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
        }
      ]
    }
  })

  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destinationA)
  await watchFileCreated(destinationB)
  const resultA = JSON.parse(await readFile(destinationA))
  const resultB = JSON.parse(await readFile(destinationB))
  delete resultA.time
  delete resultB.time
  same(resultA, {
    pid,
    hostname,
    level: 30,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
  same(resultB, {
    pid,
    hostname,
    level: 30,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
})

test('pino.transport with shared pipeline and target with pipeline=undefined', async ({ same, teardown }) => {
  const destinationA = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const destinationB = join(
    os.tmpdir(),
    '_' + Math.random().toString(36).substr(2, 9)
  )
  const transport = pino.transport({
    targets: [
      {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: destinationA },
        pipeline: 'pipelineA'
      },
      {
        target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
        options: { destination: destinationB }
      }
    ],
    pipelines: {
      pipelineA: [
        {
          target: join(__dirname, '..', 'fixtures', 'transport-transform.js')
        }
      ]
    }
  })

  teardown(transport.end.bind(transport))
  const instance = pino(transport)
  instance.info('hello')
  await watchFileCreated(destinationA)
  await watchFileCreated(destinationB)
  const resultA = JSON.parse(await readFile(destinationA))
  const resultB = JSON.parse(await readFile(destinationB))
  delete resultA.time
  delete resultB.time
  same(resultA, {
    pid,
    hostname,
    level: 30,
    msg: 'hello',
    service: 'pino' // this property was added by the transform
  })
  same(resultB, {
    pid,
    hostname,
    level: 30,
    msg: 'hello'
  })
})

// test('pino.transport with target using a custom pipeline', async ({ same, teardown }) => {
//   const destinationA = join(
//     os.tmpdir(),
//     '_' + Math.random().toString(36).substr(2, 9)
//   )
//   const destinationB = join(
//     os.tmpdir(),
//     '_' + Math.random().toString(36).substr(2, 9)
//   )
//   const transport = pino.transport({
//     targets: [
//       {
//         target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
//         options: { destination: destinationA },
//         pipeline: [{
//           target: join(__dirname, '..', 'fixtures', 'transport-transform.js'),
//           options: { payload: 'customPipeline' }
//         }]
//       },
//       {
//         target: join(__dirname, '..', 'fixtures', 'to-file-transport.js'),
//         options: { destination: destinationB }
//       }
//     ],
//     pipeline: [
//       {
//         target: join(__dirname, '..', 'fixtures', 'transport-transform.js'),
//         options: { payload: 'globalPipeline' }
//       }
//     ]
//   })

//   teardown(transport.end.bind(transport))
//   const instance = pino(transport)
//   instance.info('hello')
//   await watchFileCreated(destinationA)
//   await watchFileCreated(destinationB)
//   const resultA = JSON.parse(await readFile(destinationA))
//   const resultB = JSON.parse(await readFile(destinationB))
//   delete resultA.time
//   delete resultB.time
//   same(resultA, {
//     pid,
//     hostname,
//     level: 30,
//     msg: 'hello',
//     service: 'customPipeline' // this property was added by the transform
//   })
//   same(resultB, {
//     pid,
//     hostname,
//     level: 30,
//     msg: 'hello',
//     service: 'globalPipeline' // this property was added by the transform
//   })
// })
