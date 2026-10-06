// JAUL: io.ts

import {setTimeout as delay} from "node:timers/promises"
import fs from "fs"
import path from "path"

/**
 * Options for [[IOUtils.throttle]].
 */
export interface ThrottleOptions {
    /** Maximum number of calls (or total weight) per interval. */
    limit: number
    /** Interval length, in milliseconds. */
    interval: number
    /** Use a sliding window instead of a fixed window, so the limit is never exceeded in any rolling interval. */
    strict?: boolean
    /** Rejects all queued (and future) calls with the signal's reason when aborted. */
    signal?: AbortSignal
    /** Called with the call arguments whenever a call gets delayed. */
    onDelay?: (...args: any[]) => void
    /** Calculates the cost of a call based on its arguments, default is 1 per call. */
    weight?: (...args: any[]) => number
}

/**
 * A throttled function returned by [[IOUtils.throttle]].
 */
export type ThrottledFunction<F extends (...args: any[]) => any> = ((this: ThisParameterType<F>, ...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>) & {
    /** Set to false to bypass throttling, default is true. */
    isEnabled: boolean
    /** Number of calls waiting to be executed. */
    readonly queueSize: number
}

/**
 * Represents a job in the throttle queue, including its weight, the function to run, and the reject handler.
 */
export interface ThrottleJob {
    weight: number
    run: () => void
    reject: (reason: any) => void
}

/**
 * IO Utilities
 */
export class IOUtils {
    private static _instance: IOUtils
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Finds the correct path to the file looking first on the (optional) base path
     * then the current or running directory, finally the root directory.
     * Returns null if file is not found.
     * @param filename The filename to be searched
     * @param basepath Optional, basepath where to look for the file.
     * @returns The full path to the file if one was found, or null if not found.
     */
    getFilePath = (filename: string, basepath?: string): string => {
        const originalFilename = filename.toString()
        const mainFile = require.main?.filename ?? process.argv[1]
        const directories = [basepath, process.cwd(), mainFile ? path.dirname(mainFile) : null].filter((directory) => directory != null)
        return directories.map((directory) => path.resolve(directory, originalFilename)).find((candidate) => fs.existsSync(candidate)) ?? null
    }

    /**
     * DEPRECATED! Copy the `source` file to the `target`, both must be the full file path.
     * @param source The full source file path.
     * @param target The full target file path.
     * @deprecated Use fs.copyFileSync instead.
     */
    copyFileSync = (source: string, target: string): void => {
        fs.copyFileSync(source, target)
    }

    /**
     * DEPRECATED! Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @returns A promise with a setTimeout for the specified milliseconds.
     * @deprecated Use setTimeout from "node:timers/promises" instead.
     */
    sleep = (ms: number): Promise<void> => {
        return delay(ms)
    }

    /**
     * Creates a throttle that limits how many calls (or how much weight) can run per interval.
     * All functions wrapped by the same throttle share the same quota, and calls run in FIFO order.
     * @param options The throttle options (limit, interval, strict, signal, onDelay, weight).
     * @returns A function that wraps the passed function into a throttled, promise-returning one.
     */
    throttle = (options: ThrottleOptions): (<F extends (...args: any[]) => any>(fn: F) => ThrottledFunction<F>) => {
        const {limit, interval, strict, signal, onDelay, weight} = options

        if (!Number.isFinite(limit) || limit <= 0) {
            throw new RangeError("Expected limit to be a positive finite number")
        }
        if (!Number.isFinite(interval) || interval <= 0) {
            throw new RangeError("Expected interval to be a positive finite number")
        }
        if (weight != null && typeof weight !== "function") {
            throw new TypeError("Expected weight to be a function")
        }
        signal?.throwIfAborted()

        // Pending calls, dequeued by advancing head instead of shifting.
        let queue: ThrottleJob[] = []
        let head = 0
        let timer: NodeJS.Timeout = null

        // Fixed window state, or sliding window ticks when strict.
        let windowStart = 0
        let used = 0
        let tickTimes: number[] = []
        let tickWeights: number[] = []
        let tickHead = 0

        // Consumes the quota and returns 0, or returns how many ms to wait.
        const reserve = (cost: number): number => {
            const now = Date.now()

            if (!strict) {
                if (now - windowStart >= interval) {
                    windowStart = now
                    used = 0
                }
                if (used + cost > limit) return windowStart + interval - now
                used += cost
                return 0
            }

            while (tickHead < tickTimes.length && tickTimes[tickHead] <= now - interval) {
                used -= tickWeights[tickHead++]
            }
            if (tickHead == tickTimes.length) {
                tickTimes.length = tickWeights.length = tickHead = used = 0
            } else if (tickHead > 64 && tickHead * 2 > tickTimes.length) {
                tickTimes = tickTimes.slice(tickHead)
                tickWeights = tickWeights.slice(tickHead)
                tickHead = 0
            }

            let excess = used + cost - limit
            if (excess > 0) {
                let i = tickHead
                while ((excess -= tickWeights[i]) > 0 && i < tickTimes.length - 1) i++
                return tickTimes[i] + interval - now
            }
            if (cost > 0) {
                tickTimes.push(now)
                tickWeights.push(cost)
                used += cost
            }
            return 0
        }

        const pump = (): void => {
            timer = null

            while (head < queue.length) {
                const wait = reserve(queue[head].weight)

                // A re-entrant call (fn calling its throttled self) may have scheduled one already.
                if (wait > 0) {
                    clearTimeout(timer)
                    timer = setTimeout(pump, wait)
                    break
                }
                const job = queue[head]
                queue[head++] = undefined
                job.run()
            }

            if (head == queue.length) {
                queue.length = head = 0
            } else if (head > 1024 && head * 2 > queue.length) {
                queue = queue.slice(head)
                head = 0
            }
        }

        signal?.addEventListener(
            "abort",
            () => {
                clearTimeout(timer)
                timer = null
                for (let i = head; i < queue.length; i++) queue[i].reject(signal.reason)
                queue = []
                tickTimes = []
                tickWeights = []
                head = tickHead = windowStart = used = 0
            },
            {once: true}
        )

        return <F extends (...args: any[]) => any>(fn: F): ThrottledFunction<F> => {
            const throttled = function (this: any, ...args: any[]): Promise<any> {
                return new Promise((resolve, reject) => {
                    const run = () => {
                        try {
                            resolve(fn.apply(this, args))
                        } catch (ex) {
                            reject(ex)
                        }
                    }

                    if (!throttled.isEnabled) return run()
                    if (signal?.aborted) return reject(signal.reason)

                    let cost = 1
                    if (weight) {
                        try {
                            cost = weight(...args)
                        } catch (ex) {
                            return reject(ex)
                        }
                        if (!Number.isFinite(cost) || cost < 0) {
                            return reject(new TypeError("Expected weight to be a finite non-negative number"))
                        }
                        if (cost > limit) {
                            return reject(new RangeError(`Expected weight (${cost}) to be <= limit (${limit})`))
                        }
                    }

                    queue.push({weight: cost, run, reject})
                    if (!timer) pump()

                    // Anything still queued means this call got delayed.
                    if (head < queue.length && onDelay) {
                        try {
                            onDelay(...args)
                        } catch {}
                    }
                })
            } as ThrottledFunction<F>

            throttled.isEnabled = true
            Object.defineProperty(throttled, "queueSize", {get: () => queue.length - head})

            return throttled
        }
    }
}

// Exports...
export default IOUtils.Instance
