'use strict'

const setLevelSym = Symbol('pino.setLevel')
const getLevelSym = Symbol('pino.getLevel')
const setLevelValSym = Symbol('pino.setLevelVal')
const getLevelValSym = Symbol('pino.getLevelVal')
const levelValSym = Symbol('pino.levelVal')

const lsCacheSym = Symbol('pino.lsCache')
const chindingsSym = Symbol('pino.chindings')
const parsedChindingsSym = Symbol('pino.parsedChindings')

const asJsonSym = Symbol('pino.asJson')
const writeSym = Symbol('pino.write')
const serializersSym = Symbol('pino.serializers')
const redactFmtSym = Symbol('pino.redactFmt')

const timeSym = Symbol('pino.time')
const streamSym = Symbol('pino.stream')
const stringifySym = Symbol('pino.stringify')
const stringifiersSym = Symbol('pino.stringifiers')
const endSym = Symbol('pino.end')
const formatOptsSym = Symbol('pino.formatOpts')
const onTerminatedSym = Symbol('pino.onTerminated')
const messageKeyStringSym = Symbol('pino.messageKeyString')

const wildcardGsym = Symbol.for('pino.*')
const needsMetadataGsym = Symbol.for('needsMetadata')

module.exports = {
  setLevelSym,
  getLevelSym,
  setLevelValSym,
  getLevelValSym,
  levelValSym,
  lsCacheSym,
  chindingsSym,
  parsedChindingsSym,
  asJsonSym,
  writeSym,
  serializersSym,
  redactFmtSym,
  timeSym,
  streamSym,
  stringifySym,
  stringifiersSym,
  endSym,
  formatOptsSym,
  onTerminatedSym,
  messageKeyStringSym,
  wildcardGsym,
  needsMetadataGsym
}
