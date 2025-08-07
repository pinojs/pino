import { expectType } from "tsd";

import pino from '../../pino';
import * as pinoStar from "../../pino";
import pinoCjsImport = require ("../../pino");
const pinoCjs = require("../../pino");

const log = pino();
expectType<pino.LogFn>(log.info);
expectType<pino.LogFn>(log.error);

expectType<pino.Logger>(pinoStar.default());
expectType<pino.Logger>(pinoCjsImport());
expectType<any>(pinoCjs());

const levelChangeEventListener: pino.LevelChangeEventListener = (
    lvl: pino.LevelWithSilent | string,
    val: number,
    prevLvl: pino.LevelWithSilent | string,
    prevVal: number,
) => {}
expectType<pino.LevelChangeEventListener>(levelChangeEventListener)
