import { PathLike } from 'fs'

export declare function watchFileCreated(filename: PathLike): Promise<void>
export declare function watchForWrite(filename: PathLike, testString: string): Promise<void>
