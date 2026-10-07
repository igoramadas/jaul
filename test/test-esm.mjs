import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"
import jaul from "jaul"

const require = createRequire(import.meta.url)

assert.strictEqual(jaul, require("jaul"))
assert.equal(jaul.io.getFilePath("test-io.ts"), resolve(dirname(fileURLToPath(import.meta.url)), "test-io.ts"))
