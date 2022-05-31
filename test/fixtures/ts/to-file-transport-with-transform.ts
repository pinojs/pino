import * as fs from 'fs'
import { once } from 'events'
import { Transform } from 'stream'

async function run (opts: {  destination?: fs.PathLike }): Promise<Transform> {
  if (!opts.destination) throw new Error('kaboom')
  const stream = fs.createWriteStream(opts.destination)
  await once(stream, 'open')
  const t = new Transform({
    transform (chunk, enc, cb) {
      setImmediate(cb, null, chunk.toString().toUpperCase())
    }
  })
  t.pipe(stream)
  return t
}

export default run
