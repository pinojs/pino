'use strict'

const metadata = Symbol.for('pino.metadata')
const { levels } = require('./levels')

const defaultLevels = Object.create(levels)
defaultLevels.silent = Infinity

function multistream (streamsArray, opts) {
  let counter = 0

  streamsArray = streamsArray || []
  opts = opts || { dedupe: false }

  let levels = defaultLevels
  if (opts.levels && typeof opts.levels === 'object') {
    levels = opts.levels
  }

  const res = {
    write,
    add,
    flushSync,
    end,
    minLevel: 0,
    streams: [],
    clone,
    [metadata]: true
  }

  if (Array.isArray(streamsArray)) {
    streamsArray.forEach(add, res)
  } else {
    add.call(res, streamsArray)
  }

  // clean this object up
  // or it will stay allocated forever
  // as it is closed on the following closures
  streamsArray = null

  return res

  // we can exit early because the streams are ordered by level
  function write (data) {
    let dest
    const level = this.lastLevel
    const { streams } = this
    let stream
    for (let i = 0; i < streams.length; i++) {
      dest = streams[i]
      if (dest.minLevel <= level && (dest.maxLevel === undefined || level < dest.maxLevel)) {
        stream = dest.stream
        if (stream[metadata]) {
          const { lastTime, lastMsg, lastObj, lastLogger } = this
          stream.lastLevel = level
          stream.lastTime = lastTime
          stream.lastMsg = lastMsg
          stream.lastObj = lastObj
          stream.lastLogger = lastLogger
        }
        if (!opts.dedupe || dest.minLevel === level) {
          stream.write(data)
        }
      } else if (dest.maxLevel === undefined) {
        break
      }
    }
  }

  function flushSync () {
    for (const { stream } of this.streams) {
      if (typeof stream.flushSync === 'function') {
        stream.flushSync()
      }
    }
  }

  function add (dest) {
    const { streams } = this
    if (typeof dest.write === 'function') {
      return add.call(this, { stream: dest })
    } else if (typeof dest.levelVal === 'number') {
      return add.call(this, Object.assign({}, dest, { minLevel: dest.levelVal, levelVal: undefined }))
    } else if (dest.level !== undefined) {
      // back compatibility
      return add.call(this, Object.assign({}, dest, { minLevel: castLevel(dest.level, 30), level: undefined }))
    } else if (dest.maxLevel !== undefined && typeof dest.maxLevel !== 'number') {
      return add.call(this, Object.assign({}, dest, { maxLevel: castLevel(dest.maxLevel, undefined) }))
    } else if (typeof dest.minLevel !== 'number') {
      // we default level to 'info'
      return add.call(this, Object.assign({}, dest, { minLevel: castLevel(dest.minLevel, 30) }))
    } else {
      dest = Object.assign({}, dest)
    }

    dest.id = counter++

    streams.unshift(dest)
    streams.sort(compareByLevel)

    this.minLevel = streams[0].minLevel

    return res
  }

  function castLevel (level, defaultVal) {
    if (typeof level === 'string') {
      return levels[level]
    } else {
      return defaultVal
    }
  }

  function end () {
    for (const { stream } of this.streams) {
      if (typeof stream.flushSync === 'function') {
        stream.flushSync()
      }
      stream.end()
    }
  }

  function clone (level) {
    const streams = new Array(this.streams.length)

    for (let i = 0; i < streams.length; i++) {
      streams[i] = {
        minLevel: level,
        stream: this.streams[i].stream,
        maxLevel: this.streams[i].maxLevel
      }
    }

    return {
      write,
      add,
      minLevel: level,
      streams,
      clone,
      flushSync,
      [metadata]: true
    }
  }
}

function compareByLevel (a, b) {
  return a.minLevel - b.minLevel
}

module.exports = multistream
