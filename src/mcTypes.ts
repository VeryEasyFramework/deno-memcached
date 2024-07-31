export interface GetFlagMap {
  base64: string;
  cas: string;
  flags: string;
  hit: string;
  key: string;
  lastAccess: string;
  opaque: string;
  noreply: string;
  size: string;
  ttl: string;
  noLru: string;
  value: string;
}

export type GetReturnCode = "HD" | "VA" | "EN";
export type SetReturnCode = "HD" | "NS" | "EX" | "NF";

export type GetOptions = Partial<Record<keyof GetFlagMap, boolean>>;

/**
 * The options passed to the MemcachedClient constructor
 * for setting the connection details to the server
 */
export interface MemcachedClientConfig {
  host?: string;
  port?: number;
  unixPath?: string;
}

/**
 * The options passed to the MemcachedPool constructor.
 * Sets the connection details to the server and the pool configuration
 */
export interface MemcachedPoolConfig extends MemcachedClientConfig {
  poolSize?: number;
}
