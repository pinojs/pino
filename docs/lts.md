## Long Term Support

Pino's Long Term Support (LTS) is provided according to the schedule laid
out in this document:

1. Major releases, "X" release of [semantic versioning][semver] X.Y.Z release
   versions, are supported for a minimum period of six months from their release
   date. The release date of any specific version can be found at
   [https://github.com/pinojs/pino/releases](https://github.com/pinojs/pino/releases).

1. Major releases will receive security updates for an additional six months
   from the release of the next major release. After this period
   we will still review and release security fixes as long as they are
   provided by the community and they do not violate other constraints,
   e.g. minimum supported Node.js version.

1. Major releases will be tested and verified against all Node.js
   release lines that are supported by the
   [Node.js LTS policy](https://github.com/nodejs/Release) within the
   LTS period of that given Pino release line. This implies that only
   the latest Node.js release of a given line is supported.

A "month" is defined as 30 consecutive days.

> ## Security Releases and Semver
>
> As a consequence of providing long-term support for major releases, there
> are occasions where we need to release breaking changes as a _minor_
> version release. Such changes will _always_ be noted in the
> [release notes](https://github.com/pinojs/pino/releases).
>
> To avoid automatically receiving breaking security updates it is possible to use
> the tilde (`~`) range qualifier. For example, to get patches for the 6.1
> release, and avoid automatically updating to the 6.1 release, specify
> the dependency as `"pino": "~6.1.x"`. This will leave your application vulnerable,
> so please use with caution.

[semver]: https://semver.org/

<a name="supported-nodejs"></a>

### Supported Node.js versions

Pino follows the [Node.js release schedule][node-release]. A Pino release line
is tested against, and supports, every Node.js release line that is in its
_current_, _active LTS_, or _maintenance LTS_ phase when the Pino line is
released, as described above.

Support for a Node.js version is **only dropped in a new Pino major release**. A
published Pino major will never drop a Node.js release line that it originally
shipped with, so upgrading within a major line (for example, from `9.1.0` to
`9.4.0`) will never remove support for a Node.js version you already run on.

Once a Node.js release line reaches its end-of-life, Pino supports it on a
best-effort basis, with the following caveats:

- End-of-life Node.js versions are not exercised in continuous integration.
- Some fixes and features cannot be backported to the Pino lines that still
  support them.
- Dependencies cannot be kept up to date.

To keep running on an end-of-life Node.js version, pin your dependency to the
last Pino major line that supported it. The [Schedule](#lts-schedule) below maps
each Pino release line to the Node.js versions it supports; for example, to stay
on Node.js 14, install the latest `8.x` release with `"pino": "8.x"`.

[node-release]: https://github.com/nodejs/release#release-schedule

<a name="lts-schedule"></a>

### Schedule

| Version | Release Date | End Of LTS Date | Node.js              |
| :------ | :----------- | :-------------- | :------------------- |
| 9.x     | 2024-04-26   | TBD             | 18, 20, 22            |
| 8.x     | 2022-06-01   | 2024-10-26      | 14, 16, 18, 20        |
| 7.x     | 2021-10-14   | 2023-06-01      | 12, 14, 16           |
| 6.x     | 2020-03-07   | 2022-04-14      | 10, 12, 14, 16       |

<a name="supported-os"></a>

### CI tested operating systems

Pino uses GitHub Actions for CI testing, please refer to
[GitHub's documentation regarding workflow runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)
for further details on what the latest virtual environment is in relation to
the YAML workflow labels below:

| OS      | YAML Workflow Label    | Node.js      |
|---------|------------------------|--------------|
| Linux   | `ubuntu-latest`        | 18, 20, 22   |
| Windows | `windows-latest`       | 18, 20, 22   |
| MacOS   | `macos-latest`         | 18, 20, 22   |
