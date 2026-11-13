# Bundling

Due to its internal architecture based on Worker Threads, it is not possible to bundle Pino *without* generating additional files.

In particular, a bundler must ensure that the following files are also bundled separately:

* `lib/worker.js` from the `thread-stream` dependency
* `file.js`
* `lib/worker.js`
* Any transport used by the user (like `pino-pretty`)

Once the files above have been generated, the bundler must also add information about the files above by injecting a code that sets `__bundlerPathsOverrides` in the `globalThis` object.

The variable is an object whose keys are an identifier for the files and the values are the paths of files relative to the currently bundle files.

Example:

```javascript
// Inject this using your bundle plugin
globalThis.__bundlerPathsOverrides = {
  'thread-stream-worker': pinoWebpackAbsolutePath('./thread-stream-worker.js')
  'pino/file': pinoWebpackAbsolutePath('./pino-file.js'),
  'pino-worker': pinoWebpackAbsolutePath('./pino-worker.js'),
  'pino-pretty': pinoWebpackAbsolutePath('./pino-pretty.js'),
};
```

Note that `pino/file`, `pino-worker` and `thread-stream-worker` are required identifiers. Other identifiers are possible based on the user configuration.

## Webpack Plugin

If you are a Webpack user, you can achieve this with [pino-webpack-plugin](https://github.com/pinojs/pino-webpack-plugin) without manual configuration of `__bundlerPathsOverrides`; however, you still need to configure it manually if you are using other bundlers.

## Esbuild Plugin

[esbuild-plugin-pino](https://github.com/davipon/esbuild-plugin-pino) is the esbuild plugin to generate extra pino files for bundling.

## Bun Plugin

[bun-plugin-pino](https://github.com/vktrl/bun-plugin-pino) is the Bun plugin to generate extra pino files for bundling.

## Next.js

Since Next.js 16.1, `pino` and `pino-pretty` are on the built-in list of [`serverExternalPackages`](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages), so they are not bundled into your server code and transports work without extra configuration.

On Next.js 15 and 16.0, pino gets bundled and transports fail at runtime with an error like `Cannot find module '.../lib/worker.js'` (with Turbopack, `next build` can fail as well). Add `pino` to `serverExternalPackages` to fix it:

```javascript
// next.config.mjs
const nextConfig = {
  serverExternalPackages: ['pino']
}

export default nextConfig
```

## Missing `pino-pretty` warning

Pino v7 and older call `require('pino-pretty')` to support the `prettyPrint` option (removed in v8), so bundlers report `Module not found: Can't resolve 'pino-pretty'` when it is not installed. Upgrading to pino v8 or later removes the warning.

If the older pino comes from one of your dependencies, mark `pino-pretty` as external instead. For example, with webpack:

```javascript
module.exports = {
  externals: ['pino-pretty']
}
```
