import { expect } from 'tstyche'

import * as pinoStar from '../../pino.js'
import { type default as P, default as pino, pino as pinoNamed } from '../../pino.js'
import pinoCjsImport = require ('../../pino.js')
const pinoCjs = require('../../pino.js')
const { P: pinoCjsNamed } = require('pino')

const log = pino()
expect(log.info).type.toBe<P.LogFn>()
expect(log.error).type.toBe<P.LogFn>()

expect(pinoNamed()).type.toBe<pino.Logger>()
expect(pinoNamed()).type.toBe<P.Logger>()
expect(pinoStar.default()).type.toBe<pino.Logger>()
expect(pinoStar.pino()).type.toBe<pino.Logger>()
// expect(pinoCjsImport.default()).type.toBe<pino.Logger>()
expect(pinoCjsImport.pino()).type.toBe<pino.Logger>()
expect(pinoCjsNamed()).type.toBe<any>()
expect(pinoCjs()).type.toBe<any>()
expect(pinoNamed.stdTimeFunctions.isoTimeNano).type.toBe<P.TimeFn>()
expect(pinoNamed.stdTimeFunctions.isoTimeNano()).type.toBe<string>()

const levelChangeEventListener: P.LevelChangeEventListener = (
    lvl: P.LevelWithSilent | string,
    val: number,
    prevLvl: P.LevelWithSilent | string,
    prevVal: number,
) => {}
expect(levelChangeEventListener).type.toBe<P.LevelChangeEventListener>()
