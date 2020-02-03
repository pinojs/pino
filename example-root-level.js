'use strict';

const rootLogger = require('./')({ level: 'info' });

rootLogger.debug(`this won't be logged`);

const childLogger = rootLogger.child({ name: 'thechild' });

childLogger.debug(`this won't be logged either`);

rootLogger.rootLevel = 'debug';

rootLogger.debug(`this will be logged`);

// This would be not logged with the current version of pino
childLogger.debug(`this will be logged too. 😻`);

// btw. you can also set the rootLevel on any of the children. i.e.
childLogger.rootLevel = 'trace';
// has the same effect as:
rootLogger.rootLevel = 'trace';
