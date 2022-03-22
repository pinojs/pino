#!/bin/sh

set -e

cd ./test/fixtures/ts;

if (echo "${npm_config_user_agent}" | grep "yarn"); then
  export RUNNER="yarn";
else
  export RUNNER="npx";
fi

for filename in $(ls | grep "\.ts$"); do
  for esv in "es5" "es6" "es2017" "esnext"; do
    test "${filename}" -ot "${filename%.ts}.${esv}.cjs" \
    || (
         "${RUNNER}" tsc --target "${esv}" --module commonjs "${filename}" \
         && mv "${filename%.ts}.js" "${filename%.ts}.${esv}.cjs"
       );
  done
done
