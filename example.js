'use strict'

var sermon = require('./')()

sermon.info('hello world')
sermon.info({ obj: 42 }, 'hello world')
setImmediate(sermon.info, 'wrapped')
