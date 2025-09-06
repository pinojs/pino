# Console Adapter

The Pino Console adapter provides full Node.js Console API compatibility while maintaining Pino's performance benefits and structured logging capabilities. It allows you to use Pino loggers as drop-in replacements for the native console in your applications.

## Table of Contents

- [Tutorial: Getting Started](#tutorial-getting-started)
- [How-to Guides](#how-to-guides)
- [API Reference](#api-reference)
- [Explanation](#explanation)

---

## Tutorial: Getting Started

This tutorial will walk you through using the Pino Console adapter from basic setup to advanced features. Follow these steps to learn by doing.

### Step 1: Basic Setup

First, create a Pino logger and Console adapter:

```javascript
const pino = require('pino')

// Create a Pino logger
const logger = pino()

// Create a Console adapter
const console = new pino.Console(logger)

// Now you can use it like Node.js console
console.log('Hello, world!')
```

**Expected output:**
```json
{"level":30,"time":1693920000000,"pid":12345,"hostname":"localhost","msg":"Hello, world!"}
```

### Step 2: Basic Logging Methods

Try the core logging methods:

```javascript
const pino = require('pino')
const logger = pino()
const console = new pino.Console(logger)

console.log('This is a log message')      // → pino.info()
console.info('This is info')              // → pino.info()  
console.warn('This is a warning')         // → pino.warn()
console.error('This is an error')         // → pino.error()
console.debug('This is debug info')       // → pino.debug()
```

**Note:** Debug messages require setting the log level to 'debug' or lower.

### Step 3: Using Format Specifiers

The Console adapter supports format specifiers just like Node.js console:

```javascript
const console = new pino.Console(pino())

console.log('User %s has %d items', 'Alice', 42)
console.log('Object: %o', { name: 'test', value: 123 })
console.log('Literal percent: %%')
```

### Step 4: Timing Operations

Learn to measure execution time:

```javascript
const console = new pino.Console(pino())

console.time('operation')
// Simulate some work
setTimeout(() => {
  console.timeEnd('operation')  // Logs: "operation: 100.123ms"
}, 100)

// Or check intermediate time
console.time('longTask')
setTimeout(() => {
  console.timeLog('longTask', 'checkpoint 1')
}, 50)
```

### Step 5: Assertions and Debugging

Use assertions and stack traces:

```javascript
const console = new pino.Console(pino())

// Assertion - only logs when condition is false
console.assert(2 + 2 === 4, 'Math works')  // No output
console.assert(2 + 2 === 5, 'Math broken') // Logs error

// Stack trace
console.trace('Debug trace')  // Includes stack trace
```

### Step 6: Advanced Features

Try counters, grouping, and tables:

```javascript
const console = new pino.Console(pino())

// Counters
console.count('requests')        // "requests: 1"
console.count('requests')        // "requests: 2"
console.countReset('requests')

// Grouping
console.group('User Processing')
console.log('Processing user data...')
console.groupEnd()

// Tables
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
]
console.table(users)
```

**Congratulations!** You've learned the basics of using Pino's Console adapter. You can now replace Node.js console with Pino while keeping all your existing console-based code.

---

## How-to Guides

These guides solve specific problems you might encounter when using the Console adapter.

### How to Migrate from console.log to Pino Console

**Problem:** You have existing code using console.log and want structured logging benefits.

**Solution:**

```javascript
// Before: Using Node.js console
console.log('User logged in:', userId)
console.error('Database error:', error)

// After: Drop-in replacement with Pino Console
const pino = require('pino')
const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime
})
const console = new pino.Console(logger)

console.log('User logged in:', userId)    // Now structured JSON
console.error('Database error:', error)   // Includes error serialization
```

### How to Maintain TypeScript Type Safety

**Problem:** You need full TypeScript compatibility when migrating from Node.js Console.

**Solution:**

```typescript
import pino from 'pino'

const logger = pino()
const console = new pino.Console(logger)

// Type-safe casting to Node.js Console interface
const nodeConsole: Console = console

// All Console methods are fully typed
nodeConsole.log('message')
nodeConsole.time('timer')
nodeConsole.table([{ a: 1, b: 2 }])
```

### How to Integrate with Existing Applications

**Problem:** You want to add structured logging to an application without changing existing console usage.

**Solution:**

```javascript
// Override global console (be careful!)
const pino = require('pino')
const originalConsole = console

// Create Pino console with same interface
global.console = new pino.Console(pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
}))

// Your existing code works unchanged
console.log('This now uses Pino!')

// Access original console if needed
originalConsole.log('This uses original console')
```

### How to Configure Performance Optimization

**Problem:** You want maximum performance and need to understand level-checking behavior.

**Solution:**

```javascript
const logger = pino({
  level: 'warn'  // Only warn and error will be processed
})
const console = new pino.Console(logger)

// These are skipped entirely due to level checking
console.debug('Debug message')  // No processing cost
console.info('Info message')    // No processing cost
console.log('Log message')      // No processing cost

// These are processed
console.warn('Warning message')   // Processed
console.error('Error message')    // Processed
```

### How to Handle Different Output Formats

**Problem:** You need different output formats for development vs production.

**Solution:**

```javascript
const isDevelopment = process.env.NODE_ENV === 'development'

const logger = pino({
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
})

const console = new pino.Console(logger)

// Same code, different output based on environment
console.log('Application started')
// Development: colorized pretty output
// Production: structured JSON
```

### How to Debug Console Adapter Issues

**Problem:** Console methods aren't working as expected.

**Solution:**

```javascript
const logger = pino({ level: 'trace' }) // Enable all levels
const console = new pino.Console(logger)

// Check if level is enabled
if (logger.isLevelEnabled('debug')) {
  console.debug('Debug is enabled')
} else {
  console.warn('Debug level is disabled')
}

// Verify logger configuration
console.log('Logger level:', logger.levelVal)
console.log('Logger levels:', logger.levels)
```

---

## API Reference

Complete reference for all Console adapter methods and their signatures.

### Constructor

#### `new pino.Console(logger)`

Creates a new Console instance that uses the provided Pino logger.

**Parameters:**
- `logger` (Logger): A Pino logger instance

**Returns:** Console instance

**Throws:** TypeError if logger is not provided or invalid

**Example:**
```javascript
const logger = pino()
const console = new pino.Console(logger)
```

### Core Logging Methods

#### `console.log(message?, ...optionalParams)`
#### `console.info(message?, ...optionalParams)`

Prints to stdout with newline. Equivalent to `pino.info()`.

**Parameters:**
- `message` (any, optional): Main message to log
- `...optionalParams` (any[]): Additional parameters

**Returns:** void

#### `console.warn(message?, ...optionalParams)`

Prints to stderr with newline. Equivalent to `pino.warn()`.

#### `console.error(message?, ...optionalParams)`

Prints to stderr with newline. Equivalent to `pino.error()`.

#### `console.debug(message?, ...optionalParams)`

Prints to stdout with newline. Equivalent to `pino.debug()`.

**Note:** Only outputs when logger level allows debug messages.

### Assertion Methods

#### `console.assert(value, message?, ...optionalParams)`

Writes a message if value is falsy. Output always starts with "Assertion failed".

**Parameters:**
- `value` (any): Value to test
- `message` (string, optional): Optional message
- `...optionalParams` (any[]): Additional parameters

### Timing Methods

#### `console.time(label?)`

Starts a timer identified by a unique label.

**Parameters:**
- `label` (string, optional): Timer label (default: 'default')

#### `console.timeEnd(label?)`

Stops a timer and prints the result.

**Parameters:**
- `label` (string, optional): Timer label (default: 'default')

#### `console.timeLog(label?, ...data)`

Prints elapsed time for a running timer.

**Parameters:**
- `label` (string, optional): Timer label (default: 'default')
- `...data` (any[]): Additional data to log

### Counting Methods

#### `console.count(label?)`

Maintains an internal counter and outputs the count.

**Parameters:**
- `label` (string, optional): Counter label (default: 'default')

#### `console.countReset(label?)`

Resets the internal counter.

**Parameters:**
- `label` (string, optional): Counter label (default: 'default')

### Grouping Methods

#### `console.group(...label)`

Increases indentation of subsequent lines.

**Parameters:**
- `...label` (any[]): Labels to print

#### `console.groupCollapsed(...label)`

Alias for `group()`.

#### `console.groupEnd()`

Decreases indentation level.

### Display Methods

#### `console.table(tabularData, properties?)`

Attempts to construct a table with the data.

**Parameters:**
- `tabularData` (any): Data to display as table
- `properties` (string[], optional): Properties to include

#### `console.dir(obj, options?)`

Uses util.inspect() on obj and prints result.

**Parameters:**
- `obj` (any): Object to inspect
- `options` (InspectOptions, optional): Inspection options

#### `console.dirxml(...data)`

Calls `log()` passing the arguments. Does not produce XML formatting.

#### `console.clear()`

Logs a clear indicator. Cannot actually clear in logging context.

### Inspector Methods

#### `console.trace(message?, ...optionalParams)`

Prints stack trace to current position.

#### `console.profile(label?)`
#### `console.profileEnd(label?)`
#### `console.timeStamp(label?)`

No-op methods for Node.js Console compatibility. Inspector functionality not applicable in logging context.

### Format Specifiers

The Console adapter supports these format specifiers:

- `%s` - String conversion
- `%d` - Integer conversion  
- `%i` - Integer conversion (alias for %d)
- `%o` - Object inspection (single level)
- `%O` - Object inspection (full depth)
- `%%` - Literal percent sign

### Compatibility Matrix

| Method | Node.js Console | Pino Console | Notes |
|--------|----------------|--------------|-------|
| log() | ✓ | ✓ | Maps to pino.info() |
| info() | ✓ | ✓ | Maps to pino.info() |
| warn() | ✓ | ✓ | Maps to pino.warn() |
| error() | ✓ | ✓ | Maps to pino.error() |
| debug() | ✓ | ✓ | Maps to pino.debug() |
| assert() | ✓ | ✓ | Full compatibility |
| trace() | ✓ | ✓ | Includes stack trace |
| time() | ✓ | ✓ | High precision timing |
| timeEnd() | ✓ | ✓ | High precision timing |
| timeLog() | ✓ | ✓ | High precision timing |
| count() | ✓ | ✓ | Full compatibility |
| countReset() | ✓ | ✓ | Full compatibility |
| group() | ✓ | ✓ | Visual grouping indicators |
| groupCollapsed() | ✓ | ✓ | Same as group() |
| groupEnd() | ✓ | ✓ | Visual grouping indicators |
| table() | ✓ | ✓ | Simplified table formatting |
| dir() | ✓ | ✓ | Uses util.inspect() |
| dirxml() | ✓ | ✓ | No XML formatting |
| clear() | ✓ | ✓ | Logs clear indicator |
| profile() | ✓ | ✓ | No-op (inspector only) |
| profileEnd() | ✓ | ✓ | No-op (inspector only) |
| timeStamp() | ✓ | ✓ | No-op (inspector only) |

---

## Explanation

This section explains the design decisions, trade-offs, and when to use the Console adapter.

### Why Use Pino Console Adapter?

The Console adapter bridges two different approaches to application logging:

**Traditional Console Logging:**
- Simple, familiar API
- Human-readable output
- Limited structure
- Performance overhead
- Difficult to query/analyze

**Structured Logging with Pino:**
- JSON-structured output
- High performance
- Rich metadata
- Queryable logs
- Complex API migration

**Pino Console Adapter combines the best of both:**
- Familiar Console API (zero learning curve)
- Structured JSON output (analysis benefits)
- Pino performance (production ready)
- Gradual migration path (no big-bang changes)

### Architecture and Design Decisions

#### Level Mapping Strategy

The Console adapter maps console methods to Pino log levels based on semantic meaning:

```
console.log()   → pino.info()   (30) - General information
console.info()  → pino.info()   (30) - Informational messages  
console.warn()  → pino.warn()   (40) - Warning conditions
console.error() → pino.error()  (50) - Error conditions
console.debug() → pino.debug()  (20) - Debugging information
```

This mapping preserves the intended severity while enabling Pino's level-based filtering.

#### Format Specifier Implementation

The adapter implements Console-compatible format specifiers:

```javascript
// Console behavior
console.log('User %s has %d items', 'Alice', 42)
// Output: "User Alice has 42 items"

// Pino Console behavior  
console.log('User %s has %d items', 'Alice', 42)
// Output: {"level":30,"time":...,"msg":"User Alice has 42 items"}
```

This maintains API compatibility while providing structured output.

#### Performance Optimizations

**Level-Enabled Checks:** The adapter performs level checks before processing:

```javascript
_logWithLevel (level, ...args) {
  const logger = this[loggerSym]
  
  // Skip all processing if level not enabled
  if (!logger.isLevelEnabled || !logger.isLevelEnabled(level)) {
    return
  }
  
  // Process arguments only when needed
  // ... formatting logic
}
```

**Lazy Stack Trace Generation:** Stack traces are only generated when the debug level is enabled:

```javascript
trace (...args) {
  if (!logger.isLevelEnabled || !logger.isLevelEnabled('debug')) {
    return  // No stack trace overhead
  }
  
  const stack = new Error().stack  // Only when needed
}
```

#### TypeScript Compatibility Strategy

The adapter is designed for seamless TypeScript integration:

```typescript
// Full Node.js Console interface compatibility
export class Console {
  // All methods match Node.js Console signatures exactly
  log(message?: any, ...optionalParams: any[]): void;
  // ...
}
```

This enables safe casting: `const nodeConsole: Console = pinoConsole`

### Performance Benefits and Trade-offs

#### Benefits

**Structured Output:** Every console call produces queryable JSON logs:

```javascript
console.log('User login', { userId: 123, ip: '192.168.1.1' })
// Produces structured log with fields accessible to log analysis tools
```

**Performance:** Pino's fast serialization and level-based short-circuiting:

```javascript
// When level is 'warn', these have near-zero cost
console.debug('expensive operation', computeExpensiveData())  
console.info('status update', largeObject)
```

**Memory Efficiency:** No intermediate string formatting when logs are filtered out.

#### Trade-offs

**Output Format:** JSON instead of human-readable text:

```javascript
// Node.js console
console.log('Hello', { name: 'world' })
// Output: Hello { name: 'world' }

// Pino Console  
console.log('Hello', { name: 'world' })
// Output: {"level":30,"time":1693920000000,"msg":"Hello","name":"world"}
```

**Inspector Methods:** profile(), profileEnd(), timeStamp() are no-ops since they require V8 inspector.

**Table Formatting:** Simplified table display compared to Node.js console's rich formatting.

### When to Use Console Adapter vs Direct Pino

#### Use Console Adapter When:

- **Migrating existing applications** with extensive console usage
- **Team familiarity** with Console API is important  
- **Gradual adoption** of structured logging is preferred
- **Third-party libraries** use console and you want structured logs
- **Development convenience** of familiar API is valuable

#### Use Direct Pino When:

- **New applications** can be designed with structured logging from start
- **Performance is critical** and you want to avoid Console API overhead
- **Advanced Pino features** like child loggers, serializers, or transports are needed
- **Log levels beyond Console semantics** are required
- **Complex structured data** needs custom serialization

### Migration Patterns

#### Gradual Migration Pattern

```javascript
// Phase 1: Replace global console
const pino = require('pino')
global.console = new pino.Console(pino())

// Phase 2: Add structured data gradually
console.log('User action', { userId, action, timestamp })

// Phase 3: Replace with direct Pino calls where beneficial  
logger.info({ userId, action, timestamp }, 'User action')
```

#### Coexistence Pattern

```javascript
// Keep both available
const logger = pino()
const console = new pino.Console(logger)

// Use Console for simple messages
console.log('Server starting...')

// Use Pino directly for rich structured logging
logger.info({ 
  port: 3000, 
  env: process.env.NODE_ENV,
  features: ['auth', 'api', 'websockets']
}, 'Server configuration loaded')
```

#### Library Integration Pattern

```javascript
// Provide console to libraries that expect it
const express = require('express')
const pino = require('pino')

const logger = pino()
const console = new pino.Console(logger)

// Libraries using console now produce structured logs
process.env.DEBUG = '*'  // Enable debug libraries
require('debug').log = console.log.bind(console)
```

### Common Pitfalls and Solutions

#### Pitfall: Expecting Human-Readable Output

```javascript
// Problem: Expecting formatted output like Node.js console
console.log('User:', user)
// Actual: {"level":30,"time":...,"msg":"User:","name":"Alice"}

// Solution: Use pretty printing in development  
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})
```

#### Pitfall: Debug Messages Not Appearing

```javascript
// Problem: Debug messages missing
console.debug('Debug info')  // Nothing logged

// Solution: Set appropriate log level
const logger = pino({ level: 'debug' })
const console = new pino.Console(logger)
console.debug('Debug info')  // Now visible
```

#### Pitfall: Performance Expectations

```javascript
// Problem: Assuming Console adapter has zero overhead
console.log('Message', expensiveComputation())

// Solution: Use level checks for expensive operations
if (logger.isLevelEnabled('info')) {
  console.log('Message', expensiveComputation())
}
```

The Console adapter provides a bridge between familiar Console semantics and structured logging benefits, enabling teams to adopt modern logging practices incrementally while maintaining productivity and code compatibility.