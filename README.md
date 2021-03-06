# JAUL

[![Version](https://img.shields.io/npm/v/jaul.svg)](https://npmjs.com/package/jaul)
[![Build Status](https://img.shields.io/travis/igoramadas/jaul.svg)](https://travis-ci.org/igoramadas/jaul)
[![Coverage Status](https://img.shields.io/coveralls/igoramadas/jaul.svg)](https://coveralls.io/github/igoramadas/jaul?branch=master)

JAUL = Just Another Utilities Library

## What? Why?

Because to this date I still haven't found a good mix of small
utilities modules for my projects.

#### If it fails, it throws

You'll never need to guess what's going on behind the scenes.
For instance if you try to minify an invalid JSON, it will
throw an exception.

#### Exceptions with friendly messages

Exceptions thrown on methods might have a `friendlyMessage`
property appended to them with extra information.

## What types of utilities?

They're separated on the following areas:

* Data
* IO
* Network
* System

## Basic usage

```javascript
const jaul = require("jaul")

jaul.version // current version
```

## Data Utils

```javascript
// Removing characters from string
jaul.data.removeFromString("A1A2A3", "A") // 123
jaul.data.removeFromString("A1A2A3", ["1", "2", "3"]) // AAA

// Masking phone numbers
jaul.data.maskString("55-1234-5678") // **-****-****
jaul.data.maskString("55-1234-5678", "#", 4) // ##-####-5678

// Minify JSON
jaul.data.minifyJson(someJsonStringWithComments) // JSON object

// Returns a random RFC4122 UID
jaul.data.uuid() // ex. 12345678-1234-4444-y123-123457890111
```

## IO Utils

```javascript
// Finds out the full path to the desired filename
jaul.io.getFilePath("package.json") // finds the package.json full path
jaul.io.getFilePath("some-file.js", __dirname) // specifying __dirname as base path

// Copy file from source to target, sync
jaul.io.copyFileSync("./source-file.json", "./folder/target.json") // void

// Ensure that target folder exists, recursively creating folders
jaul.io.mkdirRecursive("path/to/some/deep/folder") // void

// Sleep code execution helper
await jaul.io.sleep(1000) // wait 1 second
```

## Network Utils

```javascript
// Get list of valid IPs on the system
jaul.network.getIP("ipv4") // array of IPv4 addresses
jaul.network.getIP("ipv6") // array of IPv6 addresses
jaul.network.getSingleIPv4() // first valid IPv4 address
jaul.network.getSingleIPv6() // first valid IPv6 address

// Get IP address of client
jaul.network.getClientIP(req) // IP address from http / express request object
jaul.network.getClientIP(sock) // IP address from websocket request object

// Check if specified IP is in range
jaul.network.ipInRange("192.168.0.1", "192.168.0.0/24") // true
jaul.network.ipInRange("10.0.0.1", "192.168.0.0/32") // false
```

## System Utils

```javascript
// Get a summary of current system stats
jaul.system.getInfo() // returns stats with labels (uptime, hostname, platform etc)
jaul.system.getInfo({labels: false}) // returns stats without labels

// Get current CPU load
jaul.system.getCpuLoad() // returns CPU load info
```

## API documentation

You can browse the full API documentation at https://jaul.devv.com.

Or check these following modules that are using Jaul:

* [Expresser](https://github.com/igoramadas/expresser)
* [Monitorado](https://github.com/igoramadas/monitorado)
