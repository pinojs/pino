import pino from "../../pino";

// This file tests the "LogFn" interface, located in the "pino.d.ts" file.

const logger = pino();

// ----------------
// 1 Argument Tests
// ----------------

// Works.
logger.info("Testing a basic string log message.");
logger.info("Using an unsupported string interpolation pattern like %x should not cause an error.");
logger.info({ foo: "foo" });
logger.info(123);
logger.info(true);

// Fails because these types are not supported.
// @ts-expect-error
logger.info(() => {});
// @ts-expect-error
logger.info(Symbol("foo"));

// -------------------------------------------
// 2 Argument Tests (with string as first arg)
// -------------------------------------------

// Works
logger.info("Message with an interpolation value: %s", "foo");
logger.info("Message with an interpolation value: %d", 123);
logger.info("Message with an interpolation value: %o", {});

// Fails because there isn't supposed to be a second argument.
// @ts-expect-error
logger.info("Message with no interpolation value.", "foo");

// Fails because we forgot the second argument entirely.
// @ts-expect-error
logger.info("Message with an interpolation value: %s");
// @ts-expect-error
logger.info("Message with an interpolation value: %d");
// @ts-expect-error
logger.info("Message with an interpolation value: %o");

// Fails because we put the wrong type as the second argument.
// @ts-expect-error
logger.info("Message with an interpolation value: %s", 123);
// @ts-expect-error
logger.info("Message with an interpolation value: %d", "foo");
// @ts-expect-error
logger.info("Message with an interpolation value: %o", "foo");

// -------------------------------------------
// 2 Argument Tests (with object as first arg)
// -------------------------------------------

// Works
logger.info({ foo: "foo" }, "bar");

// Fails because the second argument must be a string.
// @ts-expect-error
logger.info({ foo: "foo" }, 123);

// -------------------------------------------
// 3 Argument Tests (with string as first arg)
// -------------------------------------------

// Works
logger.info("Message with two interpolation values: %s %s", "foo", "bar");
logger.info("Message with two interpolation values: %d %d", 123, 456);
logger.info("Message with two interpolation values: %o %o", {}, {});

// Fails because we forgot the third argument entirely.
// @ts-expect-error
logger.info("Message with two interpolation values: %s %s", "foo");
// @ts-expect-error
logger.info("Message with two interpolation values: %d %d", 123);
// @ts-expect-error
logger.info("Message with two interpolation values: %o %o", {});

// Works
logger.info("Message with two interpolation values of different types: %s %d", "foo", 123);
logger.info("Message with two interpolation values of different types: %d %o", 123, {});

// Fails because we put the wrong type as the third argument.
// @ts-expect-error
logger.info("Message with two interpolation values of different types: %s %d", "foo", "bar");
// @ts-expect-error
logger.info("Message with two interpolation values of different types: %d %o", 123, 456);

// -------------------------------------------
// 3 Argument Tests (with object as first arg)
// -------------------------------------------

// Works
logger.info({ foo: "foo" }, "Message with an interpolation value: %s", "foo");
logger.info({ foo: "foo" }, "Message with an interpolation value: %d", 123);
logger.info({ foo: "foo" }, "Message with an interpolation value: %o", {});

// Fails because there isn't supposed to be a third argument.
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with no interpolation value.", "foo");

// Fails because we forgot the third argument entirely.
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with an interpolation value: %s");
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with an interpolation value: %d");
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with an interpolation value: %o");

// Fails because we put the wrong type as the third argument.
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with an interpolation value: %s", 123);
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with an interpolation value: %d", "foo");
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with an interpolation value: %o", "foo");

// -------------------------------------------
// 4 Argument Tests (with object as first arg)
// -------------------------------------------

// Works
logger.info({ foo: "foo" }, "Message with two interpolation values: %s %s", "foo", "bar");
logger.info({ foo: "foo" }, "Message with two interpolation values: %d %d", 123, 456);
logger.info({ foo: "foo" }, "Message with two interpolation values: %o %o", {}, {});

// Fails because we forgot the third argument entirely.
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with two interpolation values: %s %s", "foo");
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with two interpolation values: %d %d", 123);
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with two interpolation values: %o %o", {});

// Works
logger.info({ foo: "foo" }, "Message with two interpolation values of different types: %s %d", "foo", 123);
logger.info({ foo: "foo" }, "Message with two interpolation values of different types: %d %o", 123, {});

// Fails because we put the wrong type as the fourth argument.
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with two interpolation values of different types: %s %d", "foo", "bar");
// @ts-expect-error
logger.info({ foo: "foo" }, "Message with two interpolation values of different types: %d %o", 123, 456);
