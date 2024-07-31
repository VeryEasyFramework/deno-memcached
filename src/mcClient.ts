import { MemcachedParser } from "./mcParser.ts";
import type {
  GetFlagMap,
  GetOptions,
  MemcachedClientConfig,
} from "./mcTypes.ts";

const getFlagMap: GetFlagMap = {
  base64: "b", // interpret key as base64 encoded binary value
  cas: "c", // return item cas token
  flags: "f", // return client flags token
  hit: "h", // return whether item has been hit before as a 0 or 1
  key: "k", // return key as a token
  lastAccess: "l", // return time since item was last accessed in seconds
  opaque: "O", // opaque value, consumes a token and copies back with response
  noreply: "q", // use noreply semantics for return codes.
  size: "s", // return item size token
  ttl: "t", // return item TTL remaining in seconds (-1 for unlimited)
  noLru: "u", // don't bump the item in the LRU
  value: "v", // return item value in <data block>
};

export class MemcachedClient {
  connection!: Deno.Conn;
  buffSize: number = 1024;
  buffer: Uint8Array;
  private decoder: TextDecoder = new TextDecoder();
  private encoder: TextEncoder = new TextEncoder();
  parser: MemcachedParser = new MemcachedParser();
  options: Deno.ConnectOptions | Deno.UnixConnectOptions;

  constructor(options?: MemcachedClientConfig) {
    if ((options?.port || options?.host) && options?.unixPath) {
      throw new Error("Cannot use both unixPath and host/port");
    }

    this.buffer = new Uint8Array(this.buffSize);

    if (options?.unixPath) {
      this.options = {
        transport: "unix",
        path: options.unixPath,
      };
      return;
    }

    this.options = {
      port: options?.port || 11211,
      hostname: options?.host || "127.0.0.1",
    };
  }

  get connected() {
    return this.connection !== undefined;
  }

  private decode(buf: Uint8Array): string {
    return this.decoder.decode(buf);
  }

  private encode(str: string): Uint8Array {
    return this.encoder.encode(str);
  }

  private async connect(): Promise<void> {
    if (this.connected) return;
    this.connection = await Deno.connect(this.options as Deno.ConnectOptions);
  }

  private async readAll(): Promise<Uint8Array> {
    let data: Uint8Array = new Uint8Array();
    let readCount = 0;
    while (readCount !== -1) {
      readCount = await this.connection.read(this.buffer) || -1;
      data = new Uint8Array([
        ...data,
        ...this.buffer.slice(0, readCount),
      ]);
      if (readCount < this.buffSize) break;
    }
    // console.log(data)
    return data;
  }

  private async response(): Promise<string | undefined> {
    const data = await this.readAll();

    return this.parser.parse(data);
  }

  async set(
    table: string,
    id: string,
    value: string,
  ): Promise<string | undefined> {
    await this.connect();
    const key = `${table}${id}`;
    const data = this.encode(`ms ${key} ${value.length}\r\n${value}\r\n`);
    await this.connection.write(data);
    return await this.response();
  }

  async get(
    table: string,
    id: string,
    options?: GetOptions,
  ): Promise<string | undefined> {
    await this.connect();
    let flags: string[] = [];
    if (!options) options = { value: true };
    if (options) {
      for (const key in options) {
        if (options[key as keyof GetFlagMap]) {
          flags.push(getFlagMap[key as keyof GetFlagMap]);
        }
      }
      if ("value" in options && !options.value) {
        flags = flags.filter((flag) => flag !== "v");
      }
    }

    const key = `${table}${id}`;
    const data = this.encode(`mg ${key} ${flags.join(" ").trim()}\r\n`);
    await this.connection.write(data);
    return await this.response();
  }

  async setJson(
    table: string,
    id: string,
    value: Record<string, any>,
  ): Promise<string | undefined> {
    await this.connect();
    const json = JSON.stringify(value);
    return await this.set(table, id, json);
  }

  async getJson(
    table: string,
    id: string,
  ): Promise<Record<string, any> | null> {
    await this.connect();
    const response = await this.get(table, id);
    if (!response) return null;
    return JSON.parse(response);
  }

  async setList<T>(listId: string, value: T[]): Promise<string | undefined> {
    await this.connect();
    const json = JSON.stringify(value);
    return await this.set("list", listId, json);
  }

  async getList<T>(listId: string): Promise<T[] | null> {
    await this.connect();
    const response = await this.get("list", listId);
    if (!response) return null;
    return JSON.parse(response);
  }
}
