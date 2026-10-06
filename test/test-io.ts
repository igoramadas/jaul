// TEST: IO

import {after, before, describe, it} from "mocha"
import assert = require("node:assert/strict")
require("chai").should()

describe("JAUL IO Tests", function () {
    let fs = require("fs")
    let jaul = null

    let recursiveTarget = __dirname + "/mkdir/directory/inside/another"
    let copyFileTarget = __dirname + "/test-io.js.copy"

    let cleanup = function () {
        if (fs.existsSync(recursiveTarget)) {
            fs.rmdirSync(__dirname + "/mkdir/directory/inside/another")
            fs.rmdirSync(__dirname + "/mkdir/directory/inside")
            fs.rmdirSync(__dirname + "/mkdir/directory")
            fs.rmdirSync(__dirname + "/mkdir")
        }

        if (fs.existsSync(copyFileTarget)) {
            fs.unlinkSync(copyFileTarget)
        }
    }

    before(function () {
        jaul = require("../src/index")
        cleanup()
    })

    after(function () {
        cleanup()
    })

    it("Gets file from app root folder using getFilePath", function (done) {
        let currentFile = jaul.io.getFilePath("package.json")

        if (currentFile) {
            done()
        } else {
            done("Could not find package.json file")
        }
    })

    it("Gets file from current folder using getFilePath", function (done) {
        let currentFile = jaul.io.getFilePath("test-io.ts", __dirname)

        if (currentFile) {
            done()
        } else {
            done("Could not find test-io.json file.")
        }
    })

    it("Fails to get non existing file using getFilePath", function (done) {
        let currentFile = jaul.io.getFilePath("this-does-not.exist")

        if (currentFile) {
            done("The getFilePath('this-does-not.exist') should return null.")
        } else {
            done()
        }
    })

    it("Gets file path when there is no main file", function () {
        const main = require.main
        const mainFilename = main?.filename
        const argv1 = process.argv[1]

        try {
            if (main) main.filename = undefined
            process.argv[1] = undefined
            assert.ok(jaul.io.getFilePath("package.json"))
            assert.equal(jaul.io.getFilePath("this-does-not.exist"), null)
        } finally {
            if (main) main.filename = mainFilename
            process.argv[1] = argv1
        }
    })

    it("Fails to create invalid recursive directory", function (done) {
        try {
            jaul.io.mkdirRecursive("../../../../../../...someinvalidpath../!@#$%^&*()-+")
            done("The mkdirRecursive call should have thrown an exception.")
        } catch (ex) {
            done()
        }
    })

    it("Fails to create recursive directory due to existing file", function (done) {
        try {
            jaul.io.mkdirRecursive("./package.json")
            done("The mkdirRecursive call should have thrown an exception.")
        } catch (ex) {
            done()
        }
    })

    it("Copy file to another folder", function (done) {
        jaul.io.copyFileSync(__dirname + "/test-io.ts", copyFileTarget)

        if (fs.existsSync(copyFileTarget)) {
            fs.readFileSync(copyFileTarget)
                .equals(fs.readFileSync(__dirname + "/test-io.ts"))
                .should.equal(true)
            done()
        } else {
            done("File not copied to " + copyFileTarget)
        }
    })

    it("Sleep test", async function () {
        const start = performance.now()
        const result = await jaul.io.sleep(300)
        assert.ok(performance.now() - start >= 280)
        assert.equal(result, undefined)
        return true
    })

    it("Throttle limits calls per fixed window, in order", async function () {
        const start = Date.now()
        let delayed = 0
        const throttled = jaul.io.throttle({limit: 2, interval: 200, onDelay: () => delayed++})((i: number) => [i, Date.now() - start])

        const results = await Promise.all([1, 2, 3, 4, 5].map((i) => throttled(i)))
        assert.deepEqual(
            results.map((r) => r[0]),
            [1, 2, 3, 4, 5]
        )
        assert.ok(results[1][1] < 100)
        assert.ok(results[2][1] >= 190 && results[3][1] >= 190)
        assert.ok(results[4][1] >= 390)
        assert.equal(delayed, 3)
        assert.equal(throttled.queueSize, 0)
    })

    it("Throttle rejects default call weights that exceed fractional limits", async function () {
        for (const strict of [false, true]) {
            const throttled = jaul.io.throttle({limit: 0.5, interval: 10000, strict})(() => "unreachable")
            await assert.rejects(throttled(), RangeError)
            assert.equal(throttled.queueSize, 0)
        }
    })

    it("Throttle in strict mode never exceeds the limit in any rolling window", async function () {
        const times: number[] = []
        const throttled = jaul.io.throttle({limit: 3, interval: 150, strict: true})(() => times.push(Date.now()))

        await Promise.all(Array.from({length: 9}, () => throttled()))
        for (let i = 3; i < times.length; i++) {
            assert.ok(times[i] - times[i - 3] >= 145, `call ${i} ran too early`)
        }
    })

    it("Throttle shares the quota between wrapped functions and supports weights", async function () {
        const start = Date.now()
        const throttle = jaul.io.throttle({limit: 4, interval: 200, weight: (cost: number) => cost})
        const a = throttle(() => Date.now() - start)
        const b = throttle(() => Date.now() - start)

        const [first, second, third] = await Promise.all([a(3), b(1), a(2)])
        assert.ok(first < 100 && second < 100)
        assert.ok(third >= 190)

        await assert.rejects(a(5), RangeError)
        await assert.rejects(a(-1), TypeError)
    })

    it("Throttle keeps this, propagates errors and can be bypassed", async function () {
        const throttled = jaul.io.throttle({limit: 1, interval: 1000})(function (this: any, fail?: boolean) {
            if (fail) throw new Error("Boom")
            return this?.value
        })

        assert.equal(await throttled.call({value: 42}), 42)
        throttled.isEnabled = false
        await assert.rejects(throttled(true), /Boom/)
        assert.equal(await throttled.call({value: 7}), 7)
    })

    it("Throttle rejects queued calls when aborted", async function () {
        const controller = new AbortController()
        const throttled = jaul.io.throttle({limit: 1, interval: 10000, signal: controller.signal})(() => "ok")

        assert.equal(await throttled(), "ok")
        const pending = throttled()
        assert.equal(throttled.queueSize, 1)
        controller.abort(new Error("Aborted"))
        await assert.rejects(pending, /Aborted/)
        await assert.rejects(throttled(), /Aborted/)
        assert.equal(throttled.queueSize, 0)
        assert.throws(() => jaul.io.throttle({limit: 1, interval: 100, signal: controller.signal}), /Aborted/)
    })

    it("Throttle in strict mode waits for enough weight to expire", async function () {
        const start = Date.now()
        const throttled = jaul.io.throttle({limit: 3, interval: 100, strict: true, weight: (cost: number) => cost})(() => Date.now() - start)

        const results = await Promise.all([throttled(1), throttled(1), throttled(1), throttled(2)])
        assert.ok(results[2] < 50)
        assert.ok(results[3] >= 95)
    })

    it("Throttle in strict mode compacts expired ticks", async function () {
        const realNow = Date.now
        let now = realNow()
        Date.now = () => now

        try {
            const throttled = jaul.io.throttle({limit: 200, interval: 100, strict: true})((i: number) => i)
            const first = Array.from({length: 100}, (_, i) => throttled(i))
            now += 50
            const second = Array.from({length: 50}, (_, i) => throttled(100 + i))
            now += 60
            const third = Array.from({length: 149}, (_, i) => throttled(150 + i))

            const results = await Promise.all([...first, ...second, ...third])
            assert.deepEqual(
                results,
                Array.from({length: 299}, (_, i) => i)
            )
            assert.equal(throttled.queueSize, 0)
        } finally {
            Date.now = realNow
        }
    })

    it("Throttle compacts large queues, in order", async function () {
        const throttled = jaul.io.throttle({limit: 1100, interval: 100})((i: number) => i)

        const results = await Promise.all(Array.from({length: 2700}, (_, i) => throttled(i)))
        assert.deepEqual(
            results,
            Array.from({length: 2700}, (_, i) => i)
        )
        assert.equal(throttled.queueSize, 0)
    })

    it("Throttle rejects calls when the weight function throws", async function () {
        const throttled = jaul.io.throttle({
            limit: 1,
            interval: 100,
            weight: () => {
                throw new Error("Bad weight")
            }
        })(() => "ok")

        await assert.rejects(throttled(), /Bad weight/)
    })

    it("Throttle validates its options", function () {
        assert.throws(() => jaul.io.throttle({limit: 0, interval: 100}), RangeError)
        assert.throws(() => jaul.io.throttle({limit: 1, interval: Infinity}), RangeError)
        assert.throws(() => jaul.io.throttle({limit: 1, interval: 100, weight: 1}), TypeError)
    })

    it("Parallel tasks respect maxConcurrent and run in order", async function () {
        const tasks = jaul.io.parallelTasks({maxConcurrent: 2})
        const started: string[] = []
        const succeeded: string[] = []
        let maxRunning = 0

        tasks.onSuccess = (result: string, id: string) => succeeded.push(`${id}:${result}`)

        for (const id of ["a", "b", "c", "d"]) {
            tasks.schedule(id, async () => {
                started.push(id)
                maxRunning = Math.max(maxRunning, tasks.counters.running)
                await jaul.io.sleep(20)
                return id.toUpperCase()
            })
        }

        assert.equal(tasks.isRunning, true)
        assert.equal(tasks.queue.length, 2)
        await tasks.idle()

        assert.equal(maxRunning, 2)
        assert.deepEqual(started, ["a", "b", "c", "d"])
        assert.deepEqual(succeeded, ["a:A", "b:B", "c:C", "d:D"])
        assert.deepEqual(tasks.counters, {running: 0, succeeded: 4, failed: 0})
        assert.equal(tasks.isRunning, false)
    })

    it("Parallel tasks call error callbacks, with per task overrides", async function () {
        const errors: string[] = []
        const tasks = jaul.io.parallelTasks({maxConcurrent: 3, onError: (err: Error, id: string) => errors.push(`default ${id}: ${err.message}`)})
        let custom = null

        tasks.schedule("sync", () => {
            throw new Error("Sync")
        })
        tasks.schedule("async", async () => Promise.reject(new Error("Async")))
        tasks.schedule(
            "custom",
            () => {
                throw new Error("Custom")
            },
            null,
            (err: Error) => (custom = err.message)
        )
        tasks.schedule(
            "callback",
            () => "ok",
            () => {
                throw new Error("Callback")
            }
        )

        await tasks.idle()

        assert.deepEqual(errors.sort(), ["default async: Async", "default callback: Callback", "default sync: Sync"])
        assert.equal(custom, "Custom")
        assert.deepEqual(tasks.counters, {running: 0, succeeded: 1, failed: 3})
    })

    it("Parallel task callback errors are warned without stopping the queue", async function () {
        const warnings: Error[] = []
        const onWarning = (warning: Error) => warnings.push(warning)
        process.on("warning", onWarning)

        try {
            const tasks = jaul.io.parallelTasks({
                onSuccess: () => {
                    throw new Error("Callback failed")
                }
            })
            tasks.schedule("one", () => "ok")
            tasks.schedule("two", () => "ok")
            await tasks.idle()
            await new Promise((resolve) => setImmediate(resolve))

            assert.equal(tasks.counters.succeeded, 2)
            assert.equal(warnings.length, 2)
            assert.ok(warnings.every((warning) => warning.message == "Callback failed"))
        } finally {
            process.off("warning", onWarning)
        }
    })

    it("Parallel tasks clear pending tasks but let running ones finish", async function () {
        const tasks = jaul.io.parallelTasks()
        const done: string[] = []

        for (const id of ["a", "b", "c"]) {
            tasks.schedule(id, async () => {
                await jaul.io.sleep(20)
                done.push(id)
            })
        }

        assert.equal(tasks.clear(), 2)
        await tasks.idle()
        assert.deepEqual(done, ["a"])
        assert.equal(tasks.counters.running, 0)
        await tasks.idle()
    })

    it("Parallel tasks validate their options", function () {
        assert.throws(() => jaul.io.parallelTasks({maxConcurrent: 0}), RangeError)
        assert.throws(() => jaul.io.parallelTasks({maxConcurrent: 1.5}), RangeError)
        assert.equal(jaul.io.parallelTasks({maxConcurrent: Infinity}).maxConcurrent, Infinity)
        assert.throws(() => jaul.io.parallelTasks().schedule("x", null), TypeError)
    })

    it("Rate limit respects max concurrent and max per interval", async function () {
        const start = Date.now()
        const limit = jaul.io.rateLimit({maxConcurrent: 2, maxPerInterval: 3, interval: 150})
        const times: number[] = []
        let running = 0
        let maxRunning = 0

        const limited = limit(async (i: number) => {
            times.push(Date.now() - start)
            maxRunning = Math.max(maxRunning, ++running)
            await jaul.io.sleep(20)
            running--
            return i * 10
        })

        const results = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => limited(i)))
        assert.deepEqual(results, [10, 20, 30, 40, 50, 60])
        assert.equal(maxRunning, 2)
        assert.ok(times[2] < 100)
        for (let i = 3; i < times.length; i++) {
            assert.ok(times[i] - times[i - 3] >= 145, `call ${i} ran too early`)
        }
    })

    it("Rate limit shares limits between wrapped functions, keeps this and propagates errors", async function () {
        const limit = jaul.io.rateLimit({maxConcurrent: 1, maxPerInterval: 10, interval: 100})
        let running = 0
        let maxRunning = 0

        const track = async () => {
            maxRunning = Math.max(maxRunning, ++running)
            await jaul.io.sleep(10)
            running--
        }
        const a = limit(async function (this: any) {
            await track()
            return this?.value
        })
        const b = limit(async () => {
            await track()
            throw new Error("Boom")
        })

        const [value, failed] = await Promise.allSettled([a.call({value: 42}), b()])
        assert.deepEqual(value, {status: "fulfilled", value: 42})
        assert.match((failed as PromiseRejectedResult).reason.message, /Boom/)
        assert.equal(maxRunning, 1)
    })

    it("Rate limit validates its options", function () {
        assert.throws(() => jaul.io.rateLimit({maxConcurrent: 0, maxPerInterval: 1, interval: 100}), RangeError)
        assert.throws(() => jaul.io.rateLimit({maxConcurrent: 1, maxPerInterval: 0, interval: 100}), RangeError)
        assert.throws(() => jaul.io.rateLimit({maxConcurrent: 1, maxPerInterval: 1, interval: 0}), RangeError)
    })
})
