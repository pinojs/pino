'use strict'

var sermon = require('./')()

sermon.info('hello world')
setImmediate(sermon.info, 'wrapped')
