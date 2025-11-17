import * as fs from 'node:fs'
import { once } from 'node:events'

interface TransportOptions {
  destination?: fs.PathLike
}

async function run (opts: TransportOptions): Promise<fs.WriteStream> {
  if (!opts.destination) throw new Error('destination is required')
  const stream = fs.createWriteStream(opts.destination, { encoding: 'utf8' })
  await once(stream, 'open')
  return stream
}

export default run
