'use strict'

function asReqValue (req) {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    remoteAddress: req.connection.remoteAddress,
    remotePort: req.connection.remotePort
  }
}
module.exports.asReqValue = asReqValue

function asResValue (res) {
  return {
    statusCode: res.statusCode,
    header: res._header
  }
}
module.exports.asResValue = asResValue

function mapHttpRequest (req) {
  return {
    req: asReqValue(req)
  }
}
module.exports.mapHttpRequest = mapHttpRequest

function mapHttpResponse (res) {
  return {
    res: asResValue(res)
  }
}
module.exports.mapHttpResponse = mapHttpResponse

function asErrValue (err) {
  var obj = {
    type: err.constructor.name,
    message: err.message,
    stack: err.stack
  }
  for (var key in err) {
    if (obj[key] === undefined) {
      obj[key] = err[key]
    }
  }
  return obj
}
module.exports.asErrValue = asErrValue
