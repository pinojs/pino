const { test } = require('tap')
const loop = require('./fixtures/caller-loop.js')

test('caller', async ({ test, end }) => {
  test('returns a callstack of absolute paths', async ({ equal }) => {
    const callers = loop(7).map(fileName => fileName.substring(__dirname.length))

    // default callstack size is 10, but the top 2 are dropped
    equal(callers.length, 8)
    equal(callers[0], '/fixtures/caller-loop.js')
    equal(callers[1], '/fixtures/caller-loop.js')
    equal(callers[2], '/fixtures/caller-loop.js')
    equal(callers[3], '/fixtures/caller-loop.js')
    equal(callers[4], '/fixtures/caller-loop.js')
    equal(callers[5], '/fixtures/caller-loop.js')
    equal(callers[6], '/fixtures/caller-loop.js')
    equal(callers[7], '/caller.test.js')
  })

  end()
})
