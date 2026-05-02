import { expect } from 'tstyche'

import * as pinoStar from '../../pino.js'
import pinoDefault, { default as pino, pino as pinoNamed } from '../../pino.js'
import pinoCjsImport = require ('../../pino.js')

const log = pino()
expect(log.info).type.toBe<pino.LogFn>()
expect(log.error).type.toBe<pino.LogFn>()

expect(pinoDefault()).type.toBe<pino.Logger>()
expect(pinoNamed()).type.toBe<pino.Logger>()
expect(pinoStar.default()).type.toBe<pino.Logger>()
expect(pinoStar.pino()).type.toBe<pino.Logger>()
expect(pinoCjsImport()).type.toBe<pino.Logger>()
expect(pinoCjsImport.default()).type.toBe<pino.Logger>()
expect(pinoCjsImport.pino()).type.toBe<pino.Logger>()

expect(pinoDefault.stdTimeFunctions.isoTimeNano()).type.toBe<string>()
expect(pinoNamed.stdTimeFunctions.isoTimeNano()).type.toBe<string>()
expect(pinoStar.stdTimeFunctions.isoTimeNano()).type.toBe<string>()
expect(pinoCjsImport.stdTimeFunctions.isoTimeNano()).type.toBe<string>()

const levelChangeEventListener: pino.LevelChangeEventListener = (
    lvl: pino.LevelWithSilent | string,
    val: number,
    prevLvl: pino.LevelWithSilent | string,
    prevVal: number,
) => {}
expect(levelChangeEventListener).type.toBe<pino.LevelChangeEventListener>()
