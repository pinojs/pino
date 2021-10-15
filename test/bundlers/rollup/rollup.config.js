import webWorkerLoader from 'rollup-plugin-web-worker-loader'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

export default [{
  input: ['src/index.js', 'src/logger-transport.js'],
  output: [{
    dir: 'build',
    format: 'cjs'
  }],
  plugins: [
    json(),
    webWorkerLoader({ targetPlatform: 'node', inline: true }),
    nodeResolve({ browser: false }),
    commonjs()
  ]
}]
