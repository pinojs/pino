# Security Policy

This document describes the management of vulnerabilities for the
Pino project and all modules within the Pino organization.

## The Pino Threat Model

Pino is a fast JSON logger for Node.js. Understanding what Pino considers
a security vulnerability requires understanding its trust boundaries.

Pino's threat model builds upon the
[Node.js threat model](https://github.com/nodejs/node/blob/main/SECURITY.md#the-nodejs-threat-model).
We recommend reading that document first, as Pino inherits its trust assumptions.

### What Pino Trusts

The following are considered trusted and are outside the scope of Pino's
security model:

- **Application code**: Pino trusts the application code that invokes
  logging functions. If your code logs sensitive data (passwords, tokens,
  PII), that is an application-level concern, not a Pino vulnerability.
- **Log message content**: Data passed to `logger.info()`, `logger.error()`,
  etc. is trusted. Use [serializers](./docs/api.md#opt-serializers) and the
  [redact](./docs/redaction.md) feature to sanitize sensitive data before it
  is written to the log destination.
- **Configuration options**: Options passed to `pino()` are trusted.
  Misconfiguration (e.g. insecure file paths or unsafe serializers) is
  not a Pino vulnerability.
- **Transports**: Custom transports and transport configurations are
  trusted. Security issues in third-party transports should be reported
  to their respective maintainers.
- **The Node.js runtime**: Pino assumes the underlying Node.js runtime
  and operating system have not been compromised.
- **The file system**: As per the Node.js threat model, the file system
  is trusted. Path traversal or file overwrites via transport configuration
  are application-level concerns.
- **Dependencies**: Pino trusts its dependencies. Vulnerabilities in
  dependencies should be reported to those projects directly, though
  we will update promptly when fixes are available.

### What Pino Does NOT Trust

Pino currently does not directly process untrusted external input. All
data flows through application code before reaching Pino. However, if
a scenario is identified where Pino processes untrusted data and this
leads to a security issue, it would be considered a vulnerability.

### What IS a Vulnerability in Pino

The following would be considered security vulnerabilities:

- **Code execution**: If crafted log input (when used correctly by
  the application) could lead to arbitrary code execution within Pino
  itself.
- **Prototype pollution in Pino's internals**: If Pino's internal
  processing of log objects could be exploited to pollute prototypes.
- **Denial of service via algorithmic complexity**: If specific log
  patterns could cause unbounded CPU or memory consumption within
  Pino's processing (not due to the volume of logs, but due to
  algorithmic inefficiency).
- **Information disclosure from Pino internals**: If Pino leaks
  internal state or data beyond what was explicitly logged.

### What is NOT a Vulnerability in Pino

The following are explicitly out of scope:

- **Logging sensitive data**: If your application logs passwords,
  API keys, or PII, that is an application bug. Use redaction features
  like `pino.redact` to prevent this.
- **Log injection**: If untrusted user input is logged and creates
  misleading log entries, the application should sanitize input before
  logging. Pino outputs JSON by default, which mitigates many traditional
  log injection attacks.
- **Large log volume performance**: Logging millions of messages
  consuming resources is expected behavior, not a vulnerability.
- **File system access via transports**: Transports writing to files
  or network destinations are configured by the application.
- **Prototype pollution via log objects**: If application code passes
  a malicious object with `__proto__` properties to logging functions,
  Pino trusts that input as it trusts all application-provided data.
- **Vulnerabilities in example code or tests**: These are not production
  code and issues there are not security vulnerabilities.
- **Vulnerabilities requiring deprecated or experimental Node.js features**:
  Issues only reproducible on unsupported Node.js versions or experimental
  features are generally not considered vulnerabilities.

## Reporting vulnerabilities

Individuals who find potential vulnerabilities in Pino are invited
to report them via email at matteo.collina@gmail.com.

### Strict measures when reporting vulnerabilities

Avoid creating new "informative" reports. Only create new
report a potential vulnerability if you are absolutely sure this
should be tagged as an actual vulnerability. Be careful on the maintainers time.

## Handling vulnerability reports

When a potential vulnerability is reported, the following actions are taken:

### Triage

**Delay:** 5 business days

Within 5 business days, a member of the security team provides a first answer to the
individual who submitted the potential vulnerability. The possible responses
can be:

* Acceptance: what was reported is considered as a new vulnerability
* Rejection: what was reported is not considered as a new vulnerability
* Need more information: the security team needs more information in order to evaluate what was reported.

Triaging should include updating issue fields:
* Asset - set/create the module affected by the report
* Severity - TBD, currently left empty

### Correction follow-up

**Delay:** 90 days

When a vulnerability is confirmed, a member of the security team volunteers to follow
up on this report.

With the help of the individual who reported the vulnerability, they contact
the maintainers of the vulnerable package to make them aware of the
vulnerability. The maintainers can be invited as participants to the reported issue.

With the package maintainer, they define a release date for the publication
of the vulnerability. Ideally, this release date should not happen before
the package has been patched.

The report's vulnerable versions upper limit should be set to:
* `*` if there is no fixed version available by the time of publishing the report.
* the last vulnerable version. For example: `<=1.2.3` if a fix exists in `1.2.4`

### Publication

**Delay:** 90 days

Within 90 days after the triage date, the vulnerability must be made public.

**Severity**: Vulnerability severity is assessed using [CVSS v.3](https://www.first.org/cvss/user-guide).

If the package maintainer is actively developing a patch, an additional delay
can be added with the approval of the security team and the individual who
reported the vulnerability. 

At this point, a CVE will be requested by the team.
