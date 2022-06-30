import P, { pino } from "../../";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { expectError } from 'tsd'
import Logger = P.Logger;

const log = pino();
const info = log.info;
const error = log.error;

info("hello world");
error("this is at error level");
info("the answer is %d", 42);
info({ obj: 42 }, "hello world");
info({ obj: 42, b: 2 }, "hello world");
info({ obj: { aa: "bbb" } }, "another");
setImmediate(info, "after setImmediate");
error(new Error("an error"));

const writeSym = pino.symbols.writeSym;

const testUniqSymbol = {
    [pino.symbols.needsMetadataGsym]: true,
}[pino.symbols.needsMetadataGsym];

const log2: P.Logger = pino({
    name: "myapp",
    safe: true,
    serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
    },
});

pino({
    write(o) {},
});

pino({
    mixin() {
        return { customName: "unknown", customId: 111 };
    },
});

pino({
    mixin: () => ({ customName: "unknown", customId: 111 }),
});

pino({
    mixin: (context: object) => ({ customName: "unknown", customId: 111 }),
});

pino({
    mixin: (context: object, level: number) => ({ customName: "unknown", customId: 111 }),
});

pino({
    redact: { paths: [], censor: "SECRET" },
});

pino({
    redact: { paths: [], censor: () => "SECRET" },
});

pino({
    redact: { paths: [], censor: (value) => value },
});

pino({
    redact: { paths: [], censor: (value, path) => path.join() },
});

pino({
    depthLimit: 1
});

pino({
    edgeLimit: 1
});

pino({
    browser: {
        write(o) {},
    },
});

pino({
    browser: {
        write: {
            info(o) {},
            error(o) {},
        },
        serialize: true,
        asObject: true,
        transmit: {
            level: "fatal",
            send: (level, logEvent) => {
                level;
                logEvent.bindings;
                logEvent.level;
                logEvent.ts;
                logEvent.messages;
            },
        },
        disabled: false
    },
});

pino({ base: null });
// @ts-expect-error
if ("pino" in log) console.log(`pino version: ${log.pino}`);

log.child({ a: "property" }).info("hello child!");
log.level = "error";
log.info("nope");
const child = log.child({ foo: "bar" });
child.info("nope again");
child.level = "info";
child.info("hooray");
log.info("nope nope nope");
log.child({ foo: "bar" }, { level: "debug" }).debug("debug!");
child.bindings();
const customSerializers = {
    test() {
        return "this is my serializer";
    },
};
pino().child({}, { serializers: customSerializers }).info({ test: "should not show up" });
const child2 = log.child({ father: true });
const childChild = child2.child({ baby: true });
const childRedacted = pino().child({}, { redact: ["path"] })
childRedacted.info({
  msg: "logged with redacted properties",
  path: "Not shown",
});
const childAnotherRedacted = pino().child({}, {
    redact: {
        paths: ["anotherPath"],
        censor: "Not the log you\re looking for",
    }
})
childAnotherRedacted.info({
    msg: "another logged with redacted properties",
    anotherPath: "Not shown",
});

log.level = "info";
if (log.levelVal === 30) {
    console.log("logger level is `info`");
}

const listener = (lvl: any, val: any, prevLvl: any, prevVal: any) => {
    console.log(lvl, val, prevLvl, prevVal);
};
log.on("level-change", (lvl, val, prevLvl, prevVal) => {
    console.log(lvl, val, prevLvl, prevVal);
});
log.level = "trace";
log.removeListener("level-change", listener);
log.level = "info";

pino.levels.values.error === 50;
pino.levels.labels[50] === "error";

const logstderr: pino.Logger = pino(process.stderr);
logstderr.error("on stderr instead of stdout");

log.useLevelLabels = true;
log.info("lol");
log.level === "info";
const isEnabled: boolean = log.isLevelEnabled("info");

const redacted = pino({
    redact: ["path"],
});

redacted.info({
    msg: "logged with redacted properties",
    path: "Not shown",
});

const anotherRedacted = pino({
    redact: {
        paths: ["anotherPath"],
        censor: "Not the log you\re looking for",
    },
});

anotherRedacted.info({
    msg: "another logged with redacted properties",
    anotherPath: "Not shown",
});

const pretty = pino({
    prettyPrint: {
        colorize: true,
        crlf: false,
        errorLikeObjectKeys: ["err", "error"],
        errorProps: "",
        messageFormat: false,
        ignore: "",
        levelFirst: false,
        messageKey: "msg",
        timestampKey: "timestamp",
        translateTime: "UTC:h:MM:ss TT Z",
    },
});

const withMessageFormatFunc = pino({
    prettyPrint: {
        ignore: "requestId",
        messageFormat: (log, messageKey: string) => {
            const message = log[messageKey] as string;
            if (log.requestId) return `[${log.requestId}] ${message}`;
            return message;
        },
    },
});

const withTimeFn = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
});

const withNestedKey = pino({
    nestedKey: "payload",
});

const withHooks = pino({
    hooks: {
        logMethod(args, method, level) {
            return method.apply(this, ['msg', ...args]);
        },
    },
});

// Properties/types imported from pino-std-serializers
const wrappedErrSerializer = pino.stdSerializers.wrapErrorSerializer((err: pino.SerializedError) => {
    return { ...err, newProp: "foo" };
});
const wrappedReqSerializer = pino.stdSerializers.wrapRequestSerializer((req: pino.SerializedRequest) => {
    return { ...req, newProp: "foo" };
});
const wrappedResSerializer = pino.stdSerializers.wrapResponseSerializer((res: pino.SerializedResponse) => {
    return { ...res, newProp: "foo" };
});

const socket = new Socket();
const incomingMessage = new IncomingMessage(socket);
const serverResponse = new ServerResponse(incomingMessage);

const mappedHttpRequest: { req: pino.SerializedRequest } = pino.stdSerializers.mapHttpRequest(incomingMessage);
const mappedHttpResponse: { res: pino.SerializedResponse } = pino.stdSerializers.mapHttpResponse(serverResponse);

const serializedErr: pino.SerializedError = pino.stdSerializers.err(new Error());
const serializedReq: pino.SerializedRequest = pino.stdSerializers.req(incomingMessage);
const serializedRes: pino.SerializedResponse = pino.stdSerializers.res(serverResponse);

/**
 * Destination static method
 */
const destinationViaDefaultArgs = pino.destination();
const destinationViaStrFileDescriptor = pino.destination("/log/path");
const destinationViaNumFileDescriptor = pino.destination(2);
const destinationViaStream = pino.destination(process.stdout);
const destinationViaOptionsObject = pino.destination({ dest: "/log/path", sync: false });

pino(destinationViaDefaultArgs);
pino({ name: "my-logger" }, destinationViaDefaultArgs);
pino(destinationViaStrFileDescriptor);
pino({ name: "my-logger" }, destinationViaStrFileDescriptor);
pino(destinationViaNumFileDescriptor);
pino({ name: "my-logger" }, destinationViaNumFileDescriptor);
pino(destinationViaStream);
pino({ name: "my-logger" }, destinationViaStream);
pino(destinationViaOptionsObject);
pino({ name: "my-logger" }, destinationViaOptionsObject);

try {
    throw new Error('Some error')
} catch (err) {
    log.error(err)
}

interface StrictShape {
    activity: string;
    err?: unknown;
}

info<StrictShape>({
    activity: "Required property",
});

const logLine: pino.LogDescriptor = {
    level: 20,
    msg: "A log message",
    time: new Date().getTime(),
    aCustomProperty: true,
};

interface CustomLogger extends pino.Logger {
    customMethod(msg: string, ...args: unknown[]): void;
}

const serializerFunc: pino.SerializerFn = () => {}
const writeFunc: pino.WriteFn = () => {}

interface CustomBaseLogger extends pino.BaseLogger {
  child(): CustomBaseLogger
}

const customBaseLogger: CustomBaseLogger = {
  level: 'info',
  fatal() {},
  error() {},
  warn() {},
  info() {},
  debug() {},
  trace() {},
  silent() {},
  child() { return this }
}

// custom levels
const log3 = pino({ customLevels: { myLevel: 100 } })
expectError(log3.log())
log3.level = 'myLevel'
log3.myLevel('')
log3.child({}).myLevel('')

const clog3 = log3.child({}, { customLevels: { childLevel: 120 } })
// child inherit parant
clog3.myLevel('')
// child itself
clog3.childLevel('')
const cclog3 = clog3.child({}, { customLevels: { childLevel2: 130 } })
// child inherit root
cclog3.myLevel('')
// child inherit parant
cclog3.childLevel('')
// child itself
cclog3.childLevel2('')
