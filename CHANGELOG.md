# Changelog for JAUL

## 2.0.0

- NEW: Fetch utils (`jaul.fetch`) to create clients using Node's native fetch, with retries, timeouts and rate limit backoff.
- NEW: The `io.throttle()` allows to throttle functions to a max of X per interval.
- NEW: The `io.parallelTasks()` is a FIFO tasks queue with limited concurrency.
- NEW: The `io.rateLimit()` limits both concurrent calls and calls started per interval.
- NEW: The `data.ensureTrailing()` makes sure a value ends with the specified suffix (for example a slash on URLs and paths).
- NEW: The `network.getClientIP()` accepts a second parameter to also check Cloudflare's `CF-Connecting-IP` header.
- NEW: Native ESM support via package exports, alongside CommonJS.
- DEPRECATED: `data.uuid()`, use `crypto.randomUUID()` instead.
- DEPRECATED: `io.copyFileSync()`, use `fs.copyFileSync()` instead.
- DEPRECATED: `io.sleep()`, use `setTimeout()` from `node:timers/promises` instead.
- Lots of code refactoring.

## 1.7.1

- The `data.replaceTags()` now accept a fourth parameter to blank undefined values.

## 1.7.0

- Fixed bugs with `network.getSingleIPv4()` and `network.getSingleIPv6()`.
- Code refactoring.

## 1.6.2

- The `data.replaceTags()` should now accept a direct replacement value as the second argument.

## 1.6.1

- Improved support for ESM modules.
- Fixed regression bug on 1.6.0 (removed from NPM).

## 1.5.0

- No more dependencies!
- Improved TypeScript definitions.
- Removed features that are available in Node: `mkdirRecursive()`.

## 1.4.0

- Removed "lodash" and "moment" dependencies.

## 1.3.8

- Fixed regression bug on `data.replaceTags()` clearing unmatched tags.

## 1.3.7

- Fixed issue where the `data.replaceTags()` would fail if substitution was null.

## 1.3.2

- The `data.replaceTags()` now accepts an optional tag prefix (removed before replacing).

## 1.3.1

- TypeScript types are now exported with the library.

## 1.2.2

- New `data.replaceTags()` to replace tags on a string with values from an object.
- Now `network.getClientIP()` also checks for the `Forwarded` header.

## 1.2.0

- New `data.stripHtml()` to remove HTML tags from text.

## 1.1.1

- The `network.getClientIP()` checks for additional headers.

## 1.1.0

- General refactoring.

## 1.0.4

- The `io.getFilePath()` will try local / absolute path last.

## 1.0.3

- Removed `.git` from package.

## 1.0.0

- Initial release.
