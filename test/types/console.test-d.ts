import { expectAssignable, expectType } from 'tsd';
import pino from '../../pino.js';
import type { InspectOptions } from 'node:util';

// Test basic Console construction
const logger = pino();
const pinoConsole = new pino.Console(logger);

// Test that pino.Console is assignable to Node.js global Console interface
// Note: We omit the Console constructor property since it has different signatures
expectAssignable<Omit<Console, 'Console'>>(pinoConsole);

// Test all logging methods match Node.js Console signatures
expectAssignable<Console['log']>(pinoConsole.log);
expectAssignable<Console['info']>(pinoConsole.info);
expectAssignable<Console['warn']>(pinoConsole.warn);
expectAssignable<Console['error']>(pinoConsole.error);
expectAssignable<Console['debug']>(pinoConsole.debug);

// Test assertion method
expectAssignable<Console['assert']>(pinoConsole.assert);

// Test trace method
expectAssignable<Console['trace']>(pinoConsole.trace);

// Test timing methods
expectAssignable<Console['time']>(pinoConsole.time);
expectAssignable<Console['timeEnd']>(pinoConsole.timeEnd);
expectAssignable<Console['timeLog']>(pinoConsole.timeLog);

// Test counting methods
expectAssignable<Console['count']>(pinoConsole.count);
expectAssignable<Console['countReset']>(pinoConsole.countReset);

// Test grouping methods
expectAssignable<Console['group']>(pinoConsole.group);
expectAssignable<Console['groupCollapsed']>(pinoConsole.groupCollapsed);
expectAssignable<Console['groupEnd']>(pinoConsole.groupEnd);

// Test display methods
expectAssignable<Console['table']>(pinoConsole.table);
expectAssignable<Console['dir']>(pinoConsole.dir);
expectAssignable<Console['dirxml']>(pinoConsole.dirxml);

// Test clear method
expectAssignable<Console['clear']>(pinoConsole.clear);

// Test inspector-only methods for full compatibility
expectAssignable<Console['profile']>(pinoConsole.profile);
expectAssignable<Console['profileEnd']>(pinoConsole.profileEnd);
expectAssignable<Console['timeStamp']>(pinoConsole.timeStamp);

// Test that methods return void
expectType<void>(pinoConsole.log());
expectType<void>(pinoConsole.log('message'));
expectType<void>(pinoConsole.log('message', 'param1', 'param2'));

expectType<void>(pinoConsole.info());
expectType<void>(pinoConsole.info('info message'));
expectType<void>(pinoConsole.info('info %s', 'formatted'));

expectType<void>(pinoConsole.warn('warning'));
expectType<void>(pinoConsole.error('error'));
expectType<void>(pinoConsole.debug('debug'));

// Test assert method signatures
expectType<void>(pinoConsole.assert(true));
expectType<void>(pinoConsole.assert(false, 'assertion failed'));
expectType<void>(pinoConsole.assert(false, 'assertion %s', 'failed'));

// Test trace method signatures
expectType<void>(pinoConsole.trace());
expectType<void>(pinoConsole.trace('trace message'));
expectType<void>(pinoConsole.trace('trace %s', 'formatted'));

// Test timing methods signatures
expectType<void>(pinoConsole.time());
expectType<void>(pinoConsole.time('label'));
expectType<void>(pinoConsole.timeEnd());
expectType<void>(pinoConsole.timeEnd('label'));
expectType<void>(pinoConsole.timeLog());
expectType<void>(pinoConsole.timeLog('label'));
expectType<void>(pinoConsole.timeLog('label', 'data1', 'data2'));

// Test counting methods signatures  
expectType<void>(pinoConsole.count());
expectType<void>(pinoConsole.count('label'));
expectType<void>(pinoConsole.countReset());
expectType<void>(pinoConsole.countReset('label'));

// Test grouping methods signatures
expectType<void>(pinoConsole.group());
expectType<void>(pinoConsole.group('group label'));
expectType<void>(pinoConsole.group('group', 'with', 'multiple', 'args'));
expectType<void>(pinoConsole.groupCollapsed());
expectType<void>(pinoConsole.groupCollapsed('collapsed group'));
expectType<void>(pinoConsole.groupEnd());

// Test table method signatures
expectType<void>(pinoConsole.table([]));
expectType<void>(pinoConsole.table([{a: 1}, {a: 2}]));
expectType<void>(pinoConsole.table([{a: 1, b: 2}], ['a']));
expectType<void>(pinoConsole.table({key: 'value'}));

// Test dir method signature with InspectOptions
const inspectOptions: InspectOptions = {
  showHidden: true,
  depth: 2,
  colors: false
};
expectType<void>(pinoConsole.dir({}));
expectType<void>(pinoConsole.dir({key: 'value'}, inspectOptions));

// Test dirxml method signatures
expectType<void>(pinoConsole.dirxml());
expectType<void>(pinoConsole.dirxml('data'));
expectType<void>(pinoConsole.dirxml('data1', 'data2'));

// Test clear method
expectType<void>(pinoConsole.clear());

// Test inspector-only methods signatures
expectType<void>(pinoConsole.profile());
expectType<void>(pinoConsole.profile('profile-label'));
expectType<void>(pinoConsole.profileEnd());
expectType<void>(pinoConsole.profileEnd('profile-label'));
expectType<void>(pinoConsole.timeStamp());
expectType<void>(pinoConsole.timeStamp('timestamp-label'));

// Test casting scenarios that should work (omitting the Console constructor property)
const nodeConsole: Omit<Console, 'Console'> = pinoConsole;
expectType<Omit<Console, 'Console'>>(nodeConsole);

// Test that the console can be passed to functions expecting Node.js Console methods
function acceptsNodeConsole(console: Omit<Console, 'Console'>): void {
  console.log('test');
}

// This should compile without errors
acceptsNodeConsole(pinoConsole);

// Test direct method compatibility with real Console methods
function testConsoleMethodCompatibility(console: {
  log: Console['log'];
  error: Console['error'];
  warn: Console['warn'];
  info: Console['info'];
  debug: Console['debug'];
  assert: Console['assert'];
  trace: Console['trace'];
  time: Console['time'];
  timeEnd: Console['timeEnd'];
  timeLog: Console['timeLog'];
  count: Console['count'];
  countReset: Console['countReset'];
  group: Console['group'];
  groupCollapsed: Console['groupCollapsed'];
  groupEnd: Console['groupEnd'];
  table: Console['table'];
  dir: Console['dir'];
  dirxml: Console['dirxml'];
  clear: Console['clear'];
  profile: Console['profile'];
  profileEnd: Console['profileEnd'];
  timeStamp: Console['timeStamp'];
}): void {
  console.log('test');
}

// This demonstrates full method compatibility
testConsoleMethodCompatibility(pinoConsole);

// Test with different logger configurations  
const customLogger = pino({
  level: 'debug',
  name: 'test-logger'
});

const customConsole = new pino.Console(customLogger);
expectAssignable<Omit<Console, 'Console'>>(customConsole);

// Test constructor parameter types
expectType<pino.Console>(new pino.Console(logger));

// Test class is properly exported
expectType<typeof pino.Console>(pino.Console);