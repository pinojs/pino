'use strict'

var sermon = require('./')()

sermon.info('hello world')
sermon.info('the answer is %d', 42)
sermon.info({ obj: 42 }, 'hello world')
setImmediate(sermon.info, 'wrapped')
