'use strict'

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn
var pump = require('pump')
var split = require('split2')
var through = require('through2')
var steed = require('steed')

function usage () {
  return fs.createReadStream(path.join(__dirname, 'usage.txt'))
}

if (!process.argv[2]) {
  usage().pipe(process.stdout)
  process.exit()
}

var selectedBenchmark = process.argv[2].toLowerCase()
var benchmarkDir = path.resolve(__dirname)
var benchmarks = {
  basic: 'basic.bench.js',
  object: 'object.bench.js',
  deepobject: 'deep-object.bench.js',
  multiarg: 'multiArg.bench.js',
  longstring: 'long-string.bench.js',
  child: 'child.bench.js',
  grandchild: 'childChild.bench.js',
  conception: 'childCreation.bench.js'
}

function runBenchmark (name, done) {
  var benchmarkResults = {}
  benchmarkResults[name] = {}

  var processor = through(function (line, enc, cb) {
    var parts = ('' + line).split(': ')
    var parts2 = parts[0].split('*')
    var logger = parts2[0].replace('bench', '')

    if (!benchmarkResults[name][logger]) benchmarkResults[name][logger] = []

    benchmarkResults[name][logger].push({
      time: parts[1].replace('ms', ''),
      iterations: parts2[1].replace(':', '')
    })

    cb()
  })

  console.log('Running ' + name.toUpperCase() + ' benchmark\n')
  var benchmark = spawn(
    process.argv[0],
    [path.join(benchmarkDir, benchmarks[name])]
  )

  benchmark.stdout.pipe(process.stdout)
  pump(benchmark.stdout, split(), processor)

  benchmark.on('exit', function () {
    console.log('')
    if (done && typeof done === 'function') done(null, benchmarkResults)
  })
}

function sum (ar) {
  var result = 0
  for (var i = 0; i < ar.length; i += 1) {
    result += Number.parseFloat(ar[i].time)
  }
  return result
}

function displayResults (results) {
  console.log('==========')
  var benchNames = Object.keys(results)
  for (var i = 0; i < benchNames.length; i += 1) {
    console.log(benchNames[i] + ' averages')
    var benchmark = results[benchNames[i]]
    var loggers = Object.keys(benchmark)
    for (var j = 0; j < loggers.length; j += 1) {
      var logger = benchmark[loggers[j]]
      var average = sum(logger) / logger.length
      console.log(loggers[j] + ' average: ' + average)
    }
  }
  console.log('==========')
}

function toBench (done) {
  runBenchmark(this.name, done)
}

var benchQueue = []
if (selectedBenchmark !== 'all') {
  benchQueue.push(toBench.bind({name: selectedBenchmark}))
} else {
  var keys = Object.keys(benchmarks)
  for (var i = 0; i < keys.length; i += 1) {
    selectedBenchmark = keys[i]
    benchQueue.push(toBench.bind({name: selectedBenchmark}))
  }
}
steed.series(benchQueue, function (err, results) {
  if (err) return console.error(err.message)
  results.forEach(displayResults)
})
