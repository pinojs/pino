/*
 * Copyright 2024 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

const TYPE_MAPPINGS = {
  String: 'string',
  Number: 'number'
}

/**
 * Like `tap.prototype.match`. Verifies that `actual` satisfies the shape
 * provided by `expected`. This does actual assertions with `node:assert`
 *
 * There is limited support for type matching
 *
 * @example
 * match(obj, {
 *  key: String,
 *  number: Number
 * })
 *
 * @example
 * const input = {
 *   foo: /^foo.+bar$/,
 *   bar: [1, 2, '3']
 * }
 * match(input, {
 *   foo: 'foo is bar',
 *   bar: [1, 2, '3']
 * })
 * match(input, {
 *   foo: 'foo is bar',
 *   bar: [1, 2, '3', 4]
 * })
 *
 * @param {string|object} actual The entity to verify.
 * @param {string|object} expected What the entity should match against.
 * @param {object} [deps] Injected dependencies.
 * @param {object} [deps.assert] Assertion library to use.
 */
module.exports = function match (actual, expected, { assert = require('node:assert') } = {}) {
  // match substring
  if (typeof actual === 'string' && typeof expected === 'string') {
    assert.ok(actual.indexOf(expected) > -1)
    return
  }

  if (Array.isArray(expected) === true) {
    for (let i = 0; i < expected.length; i += 1) {
      match(actual[i], expected[i], { assert })
    }
    return
  }

  for (const key in expected) {
    if (key in actual) {
      if (typeof expected[key] === 'function') {
        const type = expected[key]
        // eslint-disable-next-line valid-typeof
        assert.ok(typeof actual[key] === TYPE_MAPPINGS[type.name])
      } else if (expected[key] instanceof RegExp) {
        assert.ok(expected[key].test(actual[key]))
      } else if (typeof expected[key] === 'object' && expected[key] !== null) {
        match(actual[key], expected[key], { assert })
      } else {
        assert.equal(actual[key], expected[key])
      }
    } else {
      assert.fail(`Missing ${key} in ${JSON.stringify(actual)}`)
    }
  }
}
