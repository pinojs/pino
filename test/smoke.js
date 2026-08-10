'use strict'

const { execSync } = require('node:child_process')
const { mkdtempSync, rmSync, writeFileSync, readFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

const rootDir = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'))

const smokeFiles = ['pino.js', 'browser.js', 'file.js']

const tmpDir = mkdtempSync(join(tmpdir(), 'pino-smoke-'))

function run (command, cwd) {
  return execSync(command, { cwd, stdio: 'pipe', encoding: 'utf8' })
}

function tarballName (name, version) {
  const safeName = name.startsWith('@')
    ? name.slice(1).replace('/', '-')
    : name
  return `${safeName}-${version}.tgz`
}

try {
  console.log(`Working in ${tmpDir}`)

  run(`npm pack --pack-destination "${tmpDir}"`, rootDir)
  const filename = tarballName(pkg.name, pkg.version)
  const tarballPath = join(tmpDir, filename)
  console.log(`Packed: ${filename}`)

  writeFileSync(
    join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'pino-smoke-test', version: '1.0.0', private: true }, null, 2)
  )
  run(`npm install --no-audit --no-fund "${tarballPath}"`, tmpDir)
  console.log(`Installed ${pkg.name}@${pkg.version} from tarball`)

  const installedRoot = join(tmpDir, 'node_modules', pkg.name)
  for (const file of smokeFiles) {
    const target = join(installedRoot, file)
    console.log(`Running node ${file}...`)
    run(`"${process.execPath}" "${target}"`, tmpDir)
  }

  console.log('\nAll smoke tests passed')
} catch (err) {
  console.error('\nSmoke test failed:')
  if (err.stdout) console.error(err.stdout.toString())
  if (err.stderr) console.error(err.stderr.toString())
  console.error(err.message)
  process.exitCode = 1
} finally {
  try {
    rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3 })
  } catch {}
}
