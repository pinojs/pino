'use strict'

function MultiStream () {
  if (!(this instanceof MultiStream)) {
    return new MultiStream()
  }

  this.streams = new Map()

  // enable metadata on pino
  this[Symbol.for('needsMetadata')] = true
}

MultiStream.prototype.add = function (level, i) {
  const array = this.streams.get(level) || []
  array.push(i)
  this.streams.set(level, array)
  return this
}

MultiStream.prototype.write = function (str) {
  const array = this.streams.get(this.lastLevel)

  if (!array || array.length === 0) {
    return
  }

  for (var i = 0; i < array.length; i++) {
    array[i].write(str)
  }
}

module.exports = MultiStream
