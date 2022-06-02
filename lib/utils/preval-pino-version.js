const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve('./package.json');
const metaPath = path.resolve('./lib/meta.js');

const pkg = fs.readFileSync(pkgPath, { encoding: 'utf-8'});
const {version} = JSON.parse(pkg);

const metaContent = `'use strict';

module.exports = { version: '${version}' };
`;

fs.writeFileSync(metaPath, metaContent, { encoding: 'utf-8'});