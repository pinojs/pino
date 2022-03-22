#!/bin/sh

set -e

cd ./test/fixtures/ts;

if (echo "${npm_config_user_agent}" | grep "yarn"); then
  export RUNNER="yarn";
else
  export RUNNER="npx";
fi

for esv in "es5" "es6" "es2017" "esnext"; do
  test "to-file-transport.ts" -ot "to-file-transport.${esv}.cjs" \
  || (
       "${RUNNER}" tsc --target "${esv}" --module commonjs "to-file-transport.ts" \
       && mv "to-file-transport.js" "to-file-transport.${esv}.cjs"
     );
done
