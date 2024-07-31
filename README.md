# deno-memcached

A memcached client for Deno

> Please note that this is a work in progress! There may be missing
> functionality and/or breaking changes from version to version.

## Usage

```typescript
import { Memcached } from "@eveffer/deno-memcached";
```

> Note: The default host and port are `127.0.0.1` and `11211` respectively.

### With a single connection

```typescript
const memcached = new MemcachedClient();
```

### With a custom host and port

```typescript
const memcached = new MemcachedClient({
  host: "some-host",
  port: 1234,
});
```

### Connect to a unix socket

```typescript
const memcached = new MemcachedClient({
  path: "/path/to/socket",
});
```

### With a connection pool

This will create a pool of connections to the memcached server, and handles
assigning available connections to requests.

It will create a new connection if all connections are in used.

```typescript
const memcached = new MemcachedPool({
  poolSize: 10, // default is 5
});
```

> Note: You can also pass the `host`, `port`, and `path` options to the pool
> constructor.

### Set a value

```typescript
await memcached.set("tableName", "key", "value");
```

### Get a value

```typescript
const value = await memcached.get("tableName", "key");
```

### Set a JSON value

```typescript
await memcached.setJson("tableName", "key", { foo: "bar" });
```

### Get a JSON value

```typescript
const value = await memcached.getJson("tableName", "key");
```

### Set a list value

```typescript
await memcached.setList("listId", ["foo", "bar"]);
```

### Get a list value

```typescript
const value = await memcached.getList("listId");
```
