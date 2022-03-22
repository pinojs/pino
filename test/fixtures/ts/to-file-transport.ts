import * as fs from 'fs'
import { once } from 'events'

async function run (opts: { destination?: fs.PathLike }): Promise<fs.WriteStream> {
  if (!opts.destination) throw new Error('kaboom')
  const stream = fs.createWriteStream(opts.destination, { encoding: 'utf8' })
  await once(stream, 'open')
  return stream
}

export default run
