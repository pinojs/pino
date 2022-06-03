const fs = require('fs');
const path = require('path');

const metaPath = path.resolve('./lib/meta.js');
const { version } = require('../../package.json');

const metaContent = `'use strict';

module.exports = { version: '${version}' };
`;

fs.writeFileSync(metaPath, metaContent, { encoding: 'utf-8'});