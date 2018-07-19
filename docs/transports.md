# Transports

A "transport" for Pino is some other tool into which the output of Pino is piped.
Consider the following example:

```js
var split = require('split2')
var pump = require('pump')
var through = require('through2')

var myTransport = through.obj(function (chunk, enc, cb) {
  // do whatever you want here!
  console.log(chunk)
  cb()
})

pump(process.stdin, split(JSON.parse), myTransport)
```

The above defines our "transport" as the file `my-transport-process.js`.
Now we can get the log data by:

```sh
node my-app-which-logs-stuff-to-stdout.js | node my-transport-process.js
```

Using transports in the same process causes unnecessary load and slows down
Node's single threaded event loop.

## Known Transports

If you write a transport, let us know and we will add a link here!

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
$ node yourapp.js | pino-couch -U https://your-server -d mylogs
```

[pino-couch]: https://github.com/IBM/pino-couch
[CouchDB]: https://couchdb.apache.org


<a id="pino-elasticsearch"></a>
### pino-elasticsearch

[pino-elasticsearch][pino-elasticsearch] uploads the log lines in bulk
to [Elasticsearch][elasticsearch], to be displayed in [Kibana][kibana].

It is extremely simple to use and setup

```sh
$ node yourapp.js | pino-elasticsearch
```

Assuming Elasticsearch is running on localhost.

If you wish to connect to an external elasticsearch instance (recommended for production):

* Check that you defined `network.host` in your `elasticsearch.yml` configuration file. See [elasticsearch Network Settings documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-network.html#common-network-settings) for more details.
* Launch:

```sh
$ node yourapp.js | pino-elasticsearch --host 192.168.1.42
```

Assuming Elasticsearch is running on `192.168.1.42`.

If you wish to connect to AWS Elasticsearch:
```sh
$ node yourapp.js | pino-elasticsearch  --host https://your-url.us-east-1.es.amazonaws.com --port 443 -c ./aws_config.json
```

Then, head to your
Kibana instance, and [create an index pattern](https://www.elastic.co/guide/en/kibana/current/setup.html) on `'pino'`,
the default for `pino-elasticsearch`.

[pino-elasticsearch]: https://github.com/pinojs/pino-elasticsearch
[elasticsearch]: https://www.elastic.co/products/elasticsearch
[kibana]: https://www.elastic.co/products/kibana

<a id="pino-mq"></a>
### pino-mq
pino-mq will take all messages received on process.stdin and send them over a message bus using JSON serialization; this is more a transform for pino messages because you will need some processing on the other end of the queue(s) to process message and store them in a backend; it is useful for :
* moving your backpressure from your application to broker
* transforming messages pressure to another component

```
node app.js | pino-mq -u "amqp://guest:guest@localhost/" -q "pino-logs"
```

or (recomended)

```
node app.js | pino-mq -c pino-mq.json
```

you can get a sample of configuration file by running:
```
pino-mq -g
```

for full documentation of command line switches and pino-mq.json read [readme](https://github.com/itavy/pino-mq#readme)

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
$ node yourapp.js | pino-redis -U redis://username:password@localhost:6379
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

And then run an application that uses `pino` for logging:

```sh
$ node yourapp.js | pino-socket -p 6000
```

You should see the logs from your application on both consoles.

[pino-socket]: https://www.npmjs.com/package/pino-socket

#### Logstash

You can also use [pino-socket][pino-socket] to upload logs to
[Logstash][logstash] via:

```
$ node yourapp.js | pino-socket -a 127.0.0.1 -p 5000 -m tcp
```

Assuming your logstash is running on the same host and configured as
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

See https://www.elastic.co/guide/en/kibana/current/setup.html to learn
how to setup [Kibana][kibana].

If you are a Docker fan, you can use
https://github.com/deviantony/docker-elk to setup an ELK stack.

<a id="pino-syslog"></a>
### pino-syslog

[pino-syslog][pino-syslog] is a transport, really a "transform," that converts
*pino's* logs to [RFC3164][rfc3164] compatible log messages. *pino-syslog* does not
forward the logs anywhere, it merely re-writes the messages to `stdout`. But
in combination with *pino-socket*, you can relay logs to a syslog server:

```sh
$ node yourapp.js | pino-syslog | pino-socket -a syslog.example.com
```

Example output for the "hello world" log:

```
<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: {"pid":94473,"hostname":"MacBook-Pro-3","level":30,"msg":"hello world","time":1459529098958,"v":1}
```

[pino-syslog]: https://www.npmjs.com/package/pino-syslog
[rfc3164]: https://tools.ietf.org/html/rfc3164
[logstash]: https://www.elastic.co/products/logstash
