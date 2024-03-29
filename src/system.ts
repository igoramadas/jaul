// JAUL: system.ts

import os = require("os")
import path = require("path")

/** @hidden */
let lastCpuLoad = null

/** Options for [[getInfo]] */
interface GetInfoOptions {
    /** If false, labels won't be added to the output (%, MB, etc). Default is true. */
    labels: boolean
}

/** Stats about the system, returned by [[getInfo]]. */
interface SystemMetrics {
    /** System uptime as human readable string. */
    uptime: string
    /** System hostname. */
    hostname: string
    /** Process title. */
    title: string
    /** System platform name. */
    platform: string
    /** Total memory available. */
    memoryTotal: any
    /** Current memory usage. */
    memoryUsage: any
    /** CPU load average. */
    loadAvg: any
    /** Number of CPU cores. */
    cpuCores: number
    /** Process details. */
    process: any
}

/** Describes a CPU load metric, returned by [[getCpuLoad]] */
interface CpuLoad {
    /** Idle counter */
    idle: number
    /** Total counter */
    total: number
}

/** System Utilities class. */
export class SystemUtils {
    private static _instance: SystemUtils
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Return an object with general and health information about the system.
     * @param options - Options to define the output.
     * @returns Object with system metrics attached.
     */
    getInfo = (options?: GetInfoOptions): SystemMetrics => {
        if (options == null) {
            options = {labels: true}
        }
        let result = {} as SystemMetrics

        // Get humanized uptime.
        const upSeconds = process.uptime()
        if (upSeconds >= 345600) result.uptime = `${(upSeconds / 86400).toFixed(1)} days`
        else if (upSeconds >= 7200) result.uptime = `${(upSeconds / 3600).toFixed(1)} hours`
        else if (upSeconds >= 120) result.uptime = `${(upSeconds / 60).toFixed(1)} minutes`
        else result.uptime = `${upSeconds} seconds`

        // Save parsed OS info to the result object.
        result.hostname = os.hostname()
        result.title = path.basename(process.title)
        result.platform = os.platform() + " " + os.arch() + " " + os.release()
        result.memoryTotal = (os.totalmem() / 1024 / 1024).toFixed(0)
        result.memoryUsage = (100 - (os.freemem() / os.totalmem()) * 100).toFixed(0)
        result.cpuCores = os.cpus().length

        // Get process memory stats.
        const processMemory = process.memoryUsage()

        result.process = {
            pid: process.pid,
            memoryUsed: (processMemory.rss / 1024 / 1024).toFixed(0),
            memoryHeapTotal: (processMemory.heapTotal / 1024 / 1024).toFixed(0),
            memoryHeapUsed: (processMemory.heapUsed / 1024 / 1024).toFixed(0)
        }

        // Calculate average CPU load.
        if (lastCpuLoad == null) {
            lastCpuLoad = this.getCpuLoad()
        }
        const currentCpuLoad = this.getCpuLoad()
        const idleDifference = currentCpuLoad.idle - lastCpuLoad.idle
        const totalDifference = currentCpuLoad.total - lastCpuLoad.total
        result.loadAvg = 100 - ~~((100 * idleDifference) / totalDifference)

        // Add labels to relevant metrics on the output?
        if (options.labels) {
            result.loadAvg += "%"
            result.memoryTotal += " MB"
            result.memoryUsage += "%"
            result.process.memoryUsed += " MB"
            result.process.memoryHeapTotal += " MB"
            result.process.memoryHeapUsed += " MB"
        }

        return result
    }

    /**
     * Get current CPU load, used by getInfo().
     * @returns CPU load information with idle and total counters.
     */
    getCpuLoad = (): CpuLoad => {
        let totalIdle = 0
        let totalTick = 0
        const cpus = os.cpus()
        let i = 0
        const len = cpus.length

        while (i < len) {
            const cpu = cpus[i]
            for (let t in cpu.times) {
                const value = cpu.times[t]
                totalTick += value
            }
            totalIdle += cpu.times.idle
            i++
        }

        return {idle: totalIdle / cpus.length, total: totalTick / cpus.length}
    }
}

// Exports...
export default SystemUtils.Instance
