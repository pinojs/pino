'use strict'

var fs = require('fs')
var http = require('http')
var pino = require('../')
var dest = fs.createWriteStream('/dev/null')

var log = pino(dest)
var server = http.createServer(function (req, res) {
  log.info('hello world')
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('okay')
})

server.listen(0, function () {
  var port = server.address().port
  var addr = `http://localhost:${port}`
  var iterations = 0
  function doGet (cb) {
    http.get(addr, function () {
      iterations += 1
      if (iterations < 10000) return doGet(cb)
      cb()
    })
  }

  doGet(function () {
    server.close()
  })
})
