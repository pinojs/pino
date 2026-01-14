import { expect } from 'tstyche'

import pino from '../../pino.js'

// Single
const transport = pino.transport({
  target: '#pino/pretty',
  options: { some: 'options for', the: 'transport' },
})
pino(transport)

expect(
  pino({
    transport: {
      target: 'pino-pretty',
    },
  })
).type.toBe<pino.Logger>()

// Multiple
const transports = pino.transport({
  targets: [
    {
      level: 'info',
      target: '#pino/pretty',
      options: { some: 'options for', the: 'transport' },
    },
    {
      level: 'trace',
      target: '#pino/file',
      options: { destination: './test.log' },
    },
  ],
})
pino(transports)

expect(
  pino({
    transport: {
      targets: [
        {
          level: 'info',
          target: '#pino/pretty',
          options: { some: 'options for', the: 'transport' },
        },
        {
          level: 'trace',
          target: '#pino/file',
          options: { destination: './test.log' },
        },
      ],
    },
  })
).type.toBe<pino.Logger>()

const transportsWithCustomLevels = pino.transport({
  targets: [
    {
      level: 'info',
      target: '#pino/pretty',
      options: { some: 'options for', the: 'transport' },
    },
    {
      level: 'foo',
      target: '#pino/file',
      options: { destination: './test.log' },
    },
  ],
  levels: { foo: 35 },
})
pino(transportsWithCustomLevels)

expect(
  pino({
    transport: {
      targets: [
        {
          level: 'info',
          target: '#pino/pretty',
          options: { some: 'options for', the: 'transport' },
        },
        {
          level: 'trace',
          target: '#pino/file',
          options: { destination: './test.log' },
        },
      ],
      levels: { foo: 35 },
    },
  })
).type.toBe<pino.Logger>()

const transportsWithoutOptions = pino.transport({
  targets: [{ target: '#pino/pretty' }, { target: '#pino/file' }],
  levels: { foo: 35 },
})
pino(transportsWithoutOptions)

expect(
  pino({
    transport: {
      targets: [{ target: '#pino/pretty' }, { target: '#pino/file' }],
      levels: { foo: 35 },
    },
  })
).type.toBe<pino.Logger>()

const pipelineTransport = pino.transport({
  pipeline: [
    {
      target: './my-transform.js',
    },
    {
      // Use target: 'pino/file' to write to stdout
      // without any change.
      target: 'pino-pretty',
    },
  ],
})
pino(pipelineTransport)

expect(
  pino({
    transport: {
      pipeline: [
        {
          target: './my-transform.js',
        },
        {
          // Use target: 'pino/file' to write to stdout
          // without any change.
          target: 'pino-pretty',
        },
      ],
    },
  })
).type.toBe<pino.Logger>()

type TransportConfig = {
  id: string;
}

// Custom transport params
const customTransport = pino.transport<TransportConfig>({
  target: 'custom',
  options: { id: 'abc' },
})
pino(customTransport)

// Worker
pino.transport({
  target: 'custom',
  worker: {
    argv: ['a', 'b'],
    stdin: false,
    stderr: true,
    stdout: false,
    autoEnd: true,
  },
  options: { id: 'abc' },
})

// Dedupe
pino.transport({
  targets: [],
  dedupe: true,
})
