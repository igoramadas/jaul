# JAUL

[![Version](https://img.shields.io/npm/v/jaul.svg)](https://npmjs.com/package/jaul)
[![Coverage Status](https://coveralls.io/repos/github/igoramadas/jaul/badge.svg?branch=master)](https://coveralls.io/github/igoramadas/jaul?branch=master)
[![Build Status](https://github.com/igoramadas/jaul/actions/workflows/build.yml/badge.svg)](https://github.com/igoramadas/jaul/actions)

JAUL = Just Another Utilities Library

Requires Node.js 22 or newer.

CommonJS and ESM imports are supported:

```js
const jaul = require("jaul")
```

or

```js
import jaul from "jaul"
```

## What? Why?

Because to this date I still haven't found a good mix of small utilities modules for my projects. I'm using JAUL in most of my personal and work-related projects.

#### If it fails, it throws

You'll never need to guess what's going on behind the scenes. For instance if you try to minify an invalid JSON, it will throw an exception.

#### Exceptions with friendly messages

Exceptions thrown on methods might have a `friendlyMessage` property appended to them with extra information.

## What types of utilities?

They're separated on the following areas:

- Data
- Fetch
- IO
- Network
- System

## Fetch Utils

Request client using Node's native `fetch`, with retries and a simple rate limit backoff.

```javascript
const jaul = require("jaul")

const client = jaul.fetch.create({
    timeout: 30000, // default 120000
    retryInterval: 1000, // default 1100
    backoffThreshold: 90, // default 90 (% of API quota)
    backoffInterval: 500, // default 500
    userAgent: "MyApp / 1.0.0",
    logger: console
})

// Returns the parsed JSON (or text), or true for 204 responses
const data = await client.request({url: "https://example.com/api", params: {page: 2}})

// Custom options on top of the regular fetch options
const res = await client.request({
    url: "/users",
    baseURL: "https://example.com/api/v1", // joined like axios, giving /api/v1/users
    method: "POST",
    body: {hello: "world"}, // plain objects and arrays are sent as JSON
    responseType: "auto", // or "json", "text", "arraybuffer" (returns a Buffer)
    returnResponse: true, // return {status, statusText, ok, url, headers, data}
    abortStatus: [404], // return null instead of throwing for these status codes
    onRetry: (options) => {}, // called before retrying, return false to cancel
    rateLimitExtractor: (res) => parseInt(res.headers.get("x-ratelimit-used-percent")) // used quota from 0 to 100
})
```

Requests that fail due to timeouts, dropped connections, or status codes 429, 500, 502, 503, 504, 520 and 597, are retried once after `retryInterval`. Other 4xx errors and requests aborted by a `signal` passed by the caller are not retried. Non-2xx responses throw an error with `statusCode`, `url`, `response` (including the parsed `data`) and `isTimeout` (for timeouts) properties. When `rateLimitExtractor` reports a used quota at or above `backoffThreshold`, the request is delayed progressively.

## Data Utils

```javascript
const jaul = require("jaul")

// Removing characters from string
jaul.data.removeFromString("A1A2A3", "A") // 123
jaul.data.removeFromString("A1A2A3", ["1", "2", "3"]) // AAA

// Masking phone numbers
jaul.data.maskString("55-1234-5678") // **-****-****
jaul.data.maskString("55-1234-5678", "#", 4) // ##-####-5678

// Minify JSON
jaul.data.minifyJson(someJsonStringWithComments) // JSON object

// Make sure the value ends with the specified suffix
jaul.data.ensureTrailing("https://example.com", "/") // https://example.com/
jaul.data.ensureTrailing("file", ".json") // file.json

// Returns a cryptographically random UUID v4
jaul.data.uuid() // ex. 12345678-1234-4444-8123-123457890111
```

## IO Utils

```javascript
const jaul = require("jaul")

// Finds out the full path to the desired filename
jaul.io.getFilePath("package.json") // finds the package.json full path
jaul.io.getFilePath("some-file.js", __dirname) // specifying __dirname as base path

// Copy file from source to target, sync
jaul.io.copyFileSync("./source-file.json", "./folder/target.json") // void

// Ensure that target folder exists, recursively creating folders
require("node:fs").mkdirSync("path/to/some/deep/folder", {recursive: true})

// Sleep code execution helper
await jaul.io.sleep(1000) // wait 1 second

// Throttle: max 60 calls per minute, shared by all functions wrapped by the same throttle
const throttle = jaul.io.throttle({limit: 60, interval: 60000})
const throttledFetch = throttle((url) => fetch(url))
await throttledFetch("https://example.com/api")

// Parallel tasks: run up to 5 tasks at the same time, in FIFO order
const tasks = jaul.io.parallelTasks({maxConcurrent: 5, onSuccess: (result, id) => {}, onError: (err, id) => {}})
tasks.schedule("task-1", () => fetch("https://example.com/api/1"))
tasks.schedule("task-2", () => fetch("https://example.com/api/2"), onTask2Success, onTask2Error)
await tasks.idle() // wait till all tasks have finished
tasks.counters // {running, succeeded, failed}
tasks.clear() // remove pending tasks, returns how many were removed

// Rate limit: max 5 calls at the same time, and max 60 calls started per minute (sliding window)
const limit = jaul.io.rateLimit({maxConcurrent: 5, maxPerInterval: 60, interval: 60000})
const limitedFetch = limit((url) => fetch(url))
await limitedFetch("https://example.com/api")
```

## Network Utils

```javascript
const jaul = require("jaul")

// Get list of valid IPs on the system
jaul.network.getIP("IPv4") // array of IPv4 addresses
jaul.network.getIP("IPv6") // array of IPv6 addresses
jaul.network.getSingleIPv4() // first valid IPv4 address
jaul.network.getSingleIPv6() // first valid IPv6 address

// Get IP address of client
jaul.network.getClientIP(req) // IP address from http / express request object
jaul.network.getClientIP(sock) // IP address from websocket request object
jaul.network.getClientIP(req, true) // also consider Cloudflare's CF-Connecting-IP header

// Check if specified IP is in range
jaul.network.ipInRange("192.168.0.1", "192.168.0.0/24") // true
jaul.network.ipInRange("10.0.0.1", "192.168.0.0/32") // false
```

## System Utils

```javascript
const jaul = require("jaul")

// Get a summary of current system stats
jaul.system.getInfo() // returns stats with labels (uptime, hostname, platform etc)
jaul.system.getInfo({labels: false}) // returns stats without labels

// Get current CPU load
jaul.system.getCpuLoad() // returns CPU load info
```

## 2.0.0: Native Node.js APIs

Some helpers are being deprecated starting with version `2.0.0`:

| Deprecated          | Use instead                                |
| ------------------- | ------------------------------------------ |
| `data.uuid()`       | `crypto.randomUUID()`                      |
| `io.copyFileSync()` | `fs.copyFileSync()`                        |
| `io.sleep()`        | `setTimeout()` from `node:timers/promises` |

They still work for now, but might be removed in the future.
