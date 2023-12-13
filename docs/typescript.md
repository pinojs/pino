# Usage With TypeScript

## Introduction

If you are using TypeScript, Pino should work out of the box without any additional configuration. This is because even though Pino is written in JavaScript, it includes [a TypeScript definitions file](https://github.com/pinojs/pino/blob/master/pino.d.ts) as part of its bundle.

In new TypeScript projects, you will want to use the ESM import style, like this:

```ts
import pino from "pino";

const logger = pino();

logger.info('hello world');
```

Some edge-cases are listed below.

## String Interpolation

The TypeScript definitions are configured to detect string interpolation arguments like this:

```ts
const foo: string = getFoo();
logger.info("foo: %s", foo);
```

In this case, `%s` refers to a string, as explained in the [documentation for logging method parameters](https://getpino.io/#/docs/api?id=logger).

If you use a string interpolation placeholder without a corresponding argument or with an argument of the wrong type, the TypeScript compiler will throw an error. For example:

```ts
const foo: string = getFoo();
logger.info("foo: %s"); // Error: Missing an expected argument.
logger.info("foo: %d", foo); // Error: `foo` is not a number.
```

## Validating the Object

Pino supports [logging both strings and objects](https://getpino.io/#/docs/api?id=logger). If you are passing an object to a Pino logger, you might want to validate that the object is in the correct shape. You can do this with the [`satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) in the same way that you would in other kinds of TypeScript code. For example:

```ts
const myObject = {
    foo: "someString",
    bar: "someString",
} satisfies MyObject;
logger.info(strictShape);
```

Note that passing the object type as the first generic parameter to the logger is no longer supported.

## Higher Order Functions

Unfortunately, the type definitions for the Pino logger may not work properly when invoking them from a higher order function. For example:

```ts
setTimeout(logger, 1000, "A second has passed!");
```

This is a valid invocation of the logger (i.e. simply passing a single string argument), but TypeScript will throw a spurious error. To work around this, one solution is to wrap the function invocation like this:

```ts
setTimeout(() => {
    logger("A second has passed!");
}, 1000);
```

Another solution would be to perform a manual type assertion like this:

```ts
setTimeout(logger as (message: string) => void, 1000, "A second has passed!");
```

Obviously, using type assertions makes your code less safe, so use the second solution with care.
