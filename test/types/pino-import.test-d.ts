import { expectType } from "tsd";

import pino from '../../pino';
import { pino as pinoNamed, P } from "../../pino";
import * as pinoStar from "../../pino";
import pinoCjsImport = require ("../../pino");
const pinoCjs = require("../../pino");
const { P: pinoCjsNamed } = require('pino')

const log = pino();
expectType<P.LogFn>(log.info);
expectType<P.LogFn>(log.error);

expectType<pino.Logger & Record<never, P.LogFn>>(pinoNamed());
expectType<P.Logger & Record<never, P.LogFn>>(pinoNamed());
expectType<pino.Logger & Record<never, P.LogFn>>(pinoStar.default());
expectType<pino.Logger & Record<never, P.LogFn>>(pinoStar.pino());
expectType<pino.Logger & Record<never, P.LogFn>>(pinoCjsImport.default());
expectType<pino.Logger & Record<never, P.LogFn>>(pinoCjsImport.pino());
expectType<any>(pinoCjsNamed());
expectType<any>(pinoCjs());

const levelChangeEventListener: P.LevelChangeEventListener = (
    lvl: P.LevelWithSilent | string,
    val: number,
    prevLvl: P.LevelWithSilent | string,
    prevVal: number,
) => {}
expectType<P.LevelChangeEventListener>(levelChangeEventListener)
