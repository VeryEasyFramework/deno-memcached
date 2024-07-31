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

export interface MemcachedClientConfig {
  host?: string;
  port?: number;
  unixPath?: string;
}

export interface MemcachedPoolConfig extends MemcachedClientConfig {
  poolSize?: number;
  lazyConnect?: boolean;
}
