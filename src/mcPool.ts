import { MemcachedClient } from "./mcClient.ts";
import type { GetOptions, MemcachedPoolConfig } from "./mcTypes.ts";
import type { MemcachedClientConfig } from "./mcTypes.ts";

class MemcachedPoolClient {
    locked: boolean = false;
    connection: MemcachedClient;

    constructor(config?: MemcachedClientConfig) {
        this.connection = new MemcachedClient(config);
    }

    get connected() {
        return this.connection.connection !== undefined;
    }
}

export class MemcachedPool {
    private clients: MemcachedPoolClient[] = [];

    private clientConfig?: MemcachedClientConfig;

    constructor(config?: MemcachedPoolConfig) {
        if (config?.unixPath && (config?.host || config?.port)) {
            throw new Error("Cannot use both unixPath and host/port");
        }
        this.clientConfig = {
            host: config?.host,
            port: config?.port,
            unixPath: config?.unixPath,
        };
        const size = config?.poolSize || 5;
        for (let i = 0; i < size; i++) {
            this.clients.push(new MemcachedPoolClient(this.clientConfig));
        }
    }

    private async getClient(): Promise<MemcachedPoolClient> {
        let client = this.clients.find((client) => !client.locked);
        if (!client) {
            client = new MemcachedPoolClient(this.clientConfig);
            this.clients.push(client);
            client = await this.getClient() as MemcachedPoolClient;
        }

        client.locked = true;

        return client;
    }

    async set(
        table: string,
        id: string,
        value: string,
    ): Promise<string | undefined> {
        const client = await this.getClient();
        const res = await client.connection.set(table, id, value);
        client.locked = false;
        return res;
    }

    async get(
        table: string,
        id: string,
        options?: GetOptions,
    ): Promise<string | undefined> {
        const client = await this.getClient();
        const res = await client.connection.get(table, id, options);
        client.locked = false;
        return res;
    }

    async setJson(
        table: string,
        id: string,
        value: Record<string, any>,
    ): Promise<string | undefined> {
        const client = await this.getClient();
        const res = await client.connection.setJson(table, id, value);
        client.locked = false;
        return res;
    }

    async getJson<T>(table: string, id: string): Promise<T | undefined> {
        const client = await this.getClient();
        const res = await client.connection.getJson(table, id);
        client.locked = false;
        return res as T | undefined;
    }

    async setList<T>(listId: string, value: T[]): Promise<string | undefined> {
        const client = await this.getClient();
        const res = await client.connection.setList<T>(listId, value);
        client.locked = false;
        return res;
    }

    async getList<T>(listId: string): Promise<T[] | null> {
        const client = await this.getClient();
        const res = await client.connection.getList<T>(listId);
        client.locked = false;
        return res;
    }
}
