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
const writeSym = Symbol('pino.writeSym')

const redactFmtSym = Symbol('pino.redactFmt')

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
  redactFmtSym,
  wildcardGsym,
  needsMetadataGsym
}
