# Transports

A "transport" for Pino is supplementary tool which consumes Pino logs.

Consider the following example:

```js
const split = require('split2')
const pump = require('pump')
const through = require('through2')

const myTransport = through.obj(function (chunk, enc, cb) {
  // do the necessary
  console.log(chunk)
  cb()
})

pump(process.stdin, split(JSON.parse), myTransport)
```

The above defines our "transport" as the file `my-transport-process.js`.

Logs can now be consumed using shell piping:

```sh
node my-app-which-logs-stuff-to-stdout.js | node my-transport-process.js
```

Ideally, a transport should consume logs in a separate process to the application, 
Using transports in the same process causes unnecessary load and slows down
Node's single threaded event loop.

## In-process transports

> **Pino *does not* natively support in-process transports.**

Pino does not support in-process transports because Node processes are
single threaded processes (ignoring some technical details). Given this
restriction, one of the methods Pino employs to achieve its speed is to
purposefully offload the handling of logs, and their ultimate destination, to
external processes so that the threading capabilities of the OS can be
used (or other CPUs).

One consequence of this methodology is that "error" logs do not get written to
`stderr`. However, since Pino logs are in a parseable format, it is possible to
use tools like [pino-tee][pino-tee] or [jq][jq] to work with the logs. For
example, to view only logs marked as "error" logs:

```
$ node an-app.js | jq 'select(.level == 50)'
```

In short, the way Pino generates logs:

1. Reduces the impact of logging on an application to the absolute minimum.
2. Gives greater flexibility in how logs are processed and stored.

Given all of the above, Pino recommends out-of-process log processing.

However, it is possible to wrap Pino and perform processing in-process.
For an example of this, see [pino-multi-stream][pinoms].

[pino-tee]: https://npm.im/pino-tee
[jq]: https://stedolan.github.io/jq/
[pinoms]: https://npm.im/pino-multi-stream

## Known Transports

PR's to this document are welcome for any new transports!

+ [pino-couch](#pino-couch)
+ [pino-elasticsearch](#pino-elasticsearch)
+ [pino-mq](#pino-mq)
+ [pino-papertrail](#pino-papertrail)
+ [pino-redis](#pino-redis)
+ [pino-socket](#pino-socket)
+ [pino-syslog](#pino-syslog)

<a id="pino-couch"></a>
### pino-couch

[pino-couch][pino-couch] uploads each log line as a [CouchDB][CouchDB] document.

```sh
$ node app.js | pino-couch -U https://couch-server -d mylogs
```

[pino-couch]: https://github.com/IBM/pino-couch
[CouchDB]: https://couchdb.apache.org


<a id="pino-elasticsearch"></a>
### pino-elasticsearch

[pino-elasticsearch][pino-elasticsearch] uploads the log lines in bulk
to [Elasticsearch][elasticsearch], to be displayed in [Kibana][kibana].

It is extremely simple to use and setup

```sh
$ node app.js | pino-elasticsearch
```

Assuming Elasticsearch is running on localhost.

To connect to an external elasticsearch instance (recommended for production):

* Check that `network.host` is defined in the `elasticsearch.yml` configuration file. See [elasticsearch Network Settings documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-network.html#common-network-settings) for more details.
* Launch:

```sh
$ node app.js | pino-elasticsearch --host 192.168.1.42
```

Assuming Elasticsearch is running on `192.168.1.42`.

To connect to AWS Elasticsearch:

```sh
$ node app.js | pino-elasticsearch  --host https://es-url.us-east-1.es.amazonaws.com --port 443 -c ./aws_config.json
```

Then [create an index pattern](https://www.elastic.co/guide/en/kibana/current/setup.html) on `'pino'` (the default index key for `pino-elasticsearch`) on the Kibana instance.

[pino-elasticsearch]: https://github.com/pinojs/pino-elasticsearch
[elasticsearch]: https://www.elastic.co/products/elasticsearch
[kibana]: https://www.elastic.co/products/kibana

<a id="pino-mq"></a>
### pino-mq

The `pino-mq` transport will take all messages received on `process.stdin` and send them over a message bus using JSON serialization.

This useful for:

* moving backpressure from application to broker
* transforming messages pressure to another component

```
node app.js | pino-mq -u "amqp://guest:guest@localhost/" -q "pino-logs"
```

Alternatively a configuration file can be used:

```
node app.js | pino-mq -c pino-mq.json
```

A base configuration file can be initialized with:

```
pino-mq -g
```

For full documentation of command line switches and configuration see [the `pino-mq` readme](https://github.com/itavy/pino-mq#readme)

<a id="pino-papertrail"></a>
### pino-papertrail
pino-papertrail is a transport that will forward logs to the [papertrail](https://papertrailapp.com) log service through an UDPv4 socket.

Given an application `foo` that logs via pino, and a papertrail destination that collects logs on port UDP `12345` on address `bar.papertrailapp.com`, you would use `pino-papertrail`
like so:

```
node yourapp.js | pino-papertrail --host bar.papertrailapp.com --port 12345 --appname foo
```


for full documentation of command line switches read [readme](https://github.com/ovhemert/pino-papertrail#readme)

<a id="pino-redis"></a>
### pino-redis

[pino-redis][pino-redis] loads pino logs into [Redis][Redis].

```sh
$ node app.js | pino-redis -U redis://username:password@localhost:6379
```

[pino-redis]: https://github.com/buianhthang/pino-redis
[Redis]: https://redis.io/

<a id="pino-socket"></a>
### pino-socket

[pino-socket][pino-socket] is a transport that will forward logs to a IPv4
UDP or TCP socket.

As an example, use `socat` to fake a listener:

```sh
$ socat -v udp4-recvfrom:6000,fork exec:'/bin/cat'
```

Then run an application that uses `pino` for logging:

```sh
$ node app.js | pino-socket -p 6000
```

Logs from the application should be observed on both consoles.

[pino-socket]: https://www.npmjs.com/package/pino-socket

#### Logstash

The [pino-socket][pino-socket] module can also be used to upload logs to
[Logstash][logstash] via:

```
$ node app.js | pino-socket -a 127.0.0.1 -p 5000 -m tcp
```

Assuming logstash is running on the same host and configured as
follows:

```
input {
  tcp {
    port => 5000
  }
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => "127.0.0.1:9200"
  }
}
```

See <https://www.elastic.co/guide/en/kibana/current/setup.html> to learn
how to setup [Kibana][kibana].

For Docker users, see
https://github.com/deviantony/docker-elk to setup an ELK stack.

<a id="pino-syslog"></a>
### pino-syslog

[pino-syslog][pino-syslog] is a transforming transport that converts
`pino` NDJSON logs to [RFC3164][rfc3164] compatible log messages. The `pino-syslog` module does not
forward the logs anywhere, it merely re-writes the messages to `stdout`. But
when used in combination with `pino-socket` the log messages can be relayed to a syslog server:

```sh
$ node app.js | pino-syslog | pino-socket -a syslog.example.com
```

Example output for the "hello world" log:

```
<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: {"pid":94473,"hostname":"MacBook-Pro-3","level":30,"msg":"hello world","time":1459529098958,"v":1}
```

[pino-syslog]: https://www.npmjs.com/package/pino-syslog
[rfc3164]: https://tools.ietf.org/html/rfc3164
[logstash]: https://www.elastic.co/products/logstash
