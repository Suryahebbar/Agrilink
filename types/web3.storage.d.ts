declare module 'web3.storage' {
  export interface Web3StorageOptions {
    token: string;
    endpoint?: string;
  }

  export class Web3Storage {
    constructor(options: Web3StorageOptions);
    
    put(files: File[], options?: {
      name?: string;
      wrapWithDirectory?: boolean;
    }): Promise<string>;
    
    get(cid: string): Promise<File | undefined>;
    
    list(): Promise<AsyncIterable<{ cid: string; name: string; size: number }>>;
    
    delete(cid: string): Promise<boolean>;
  }

  export class File {
    constructor(data: ArrayBuffer[] | Uint8Array[] | Blob[], name: string, options?: { type?: string });
  }

  export default Web3Storage;
}
