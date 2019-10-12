# Web Frameworks

Since HTTP logging is a primary use case, Pino has first class support for the Node.js
web framework ecosystem.

+ [Pino with Fastify](#fastify)
+ [Pino with Express](#express)
+ [Pino with Hapi](#hapi)
+ [Pino with Restify](#restify)
+ [Pino with Koa](#koa)
+ [Pino with Node core `http`](#http)
+ [Pino with Nest](#nest)

<a id="fastify"></a>
## Pino with Fastify

The Fastify web framework comes bundled with Pino by default, simply set Fastify's
`logger` option to `true` and use `request.log` or `reply.log` for log messages that correspond
to each individual request:

```js
const fastify = require('fastify')({
  logger: true
})
fastify.get('/', async (request, reply) => {
  request.log.info('something')
  return { hello: 'world' }
})
```

The `logger` option can also be set to an object, which will be passed through directly
as the [`pino` options object](api.md#options).

See the [fastify documentation](https://www.fastify.io/docs/latest/Logging/) for more information.

<a id="express"></a>
## Pino with Express

```sh
npm install express-pino-logger
```

```js
const app = require('express')()
const pino = require('express-pino-logger')()

app.use(pino)

app.get('/', function (req, res) {
  req.log.info('something')
  res.send('hello world')
})

app.listen(3000)
```

See the [express-pino-logger readme](http://npm.im/express-pino-logger) for more info.

<a id="hapi"></a>
## Pino with Hapi

```sh
npm install hapi-pino
```

```js
'use strict'

require('make-promises-safe')

const Hapi = require('hapi')

async function start () {
  // Create a server with a host and port
  const server = Hapi.server({
    host: 'localhost',
    port: 3000
  })

  // Add the route
  server.route({
    method: 'GET',
    path: '/',
    handler: async function (request, h) {
      // request.log is HAPI standard way of logging
      request.log(['a', 'b'], 'Request into hello world')

      // a pino instance can also be used, which will be faster
      request.logger.info('In handler %s', request.path)

      return 'hello world'
    }
  })

  await server.register({
    plugin: require('.'),
    options: {
      prettyPrint: process.env.NODE_ENV !== 'production'
    }
  })

  // also as a decorated API
  server.logger().info('another way for accessing it')

  // and through Hapi standard logging system
  server.log(['subsystem'], 'third way for accessing it')

  await server.start()

  return server
}

start().catch((err) => {
  console.log(err)
  process.exit(1)
})
```

See the [hapi-pino readme](http://npm.im/hapi-pino) for more info.

<a id="restify"></a>
## Pino with Restify

```sh
npm install restify-pino-logger
```

```js
const server = require('restify').createServer({name: 'server'})
const pino = require('restify-pino-logger')()

server.use(pino)

server.get('/', function (req, res) {
  req.log.info('something')
  res.send('hello world')
})

server.listen(3000)
```

See the [restify-pino-logger readme](http://npm.im/restify-pino-logger) for more info.

<a id="koa"></a>
## Pino with Koa

### Koa

```sh
npm install koa-pino-logger
```

```js
const Koa = require('koa')
const app = new Koa()
const pino = require('koa-pino-logger')()

app.use(pino)

app.use((ctx) => {
  ctx.log.info('something else')
  ctx.body = 'hello world'
})

app.listen(3000)
```

See the [koa-pino-logger readme](https://github.com/pinojs/koa-pino-logger) for more info.

<a id="http"></a>
## Pino with Node core `http`

```sh
npm install pino-http
```

```js
const http = require('http')
const server = http.createServer(handle)
const logger = require('pino-http')()

function handle (req, res) {
  logger(req, res)
  req.log.info('something else')
  res.end('hello world')
}

server.listen(3000)
```

See the [pino-http readme](http://npm.im/pino-http) for more info.


<a id="nest"></a>
## Pino with Nest

```sh
npm install nestjs-pino
```

```ts
import { NestFactory } from '@nestjs/core'
import { Controller, Get, Module } from '@nestjs/common'
import { LoggerModule, Logger } from 'nestjs-pino'

@Controller()
export class AppController {
  constructor(private readonly logger: Logger) {}

  @Get()
  getHello() {
    this.logger.log('something')
    return `Hello world`
  }
}

@Module({
  controllers: [AppController],
  imports: [LoggerModule.forRoot()]
})
class MyModule {}

async function bootstrap() {
  const app = await NestFactory.create(MyModule)
  await app.listen(3000)
}
bootstrap()
```

See the [nestjs-pino readme](http://npm.im/nestjs-pino) for more info.
