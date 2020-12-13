import SonicBoom from 'sonic-boom'

export default (opts = { fd: 1 }) => {
  if (!opts.dest && !opts.fd) opts.fd = 1
  const sonic = new SonicBoom(opts)
  return (data) => {
    sonic.write(data, 0, true)
  }
}
