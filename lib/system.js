"use strict";
/*
 * JAUL: System utilities
 */
const moment = require("moment");
const os = require("os");
const path = require("path");
// Temporary variable used to calculate CPU usage.
let lastCpuLoad = null;
class SystemUtils {
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    /*
     * Return an object with general and health information about the system.
     * @param options - Options to define the output.
     * @returns Object with system metrics attached.
     */
    getInfo(options) {
        if (options == null) {
            options = { labels: true };
        }
        let result = {};
        // Save parsed OS info to the result object.
        result.uptime = moment.duration(process.uptime(), "s").humanize();
        result.hostname = os.hostname();
        result.title = path.basename(process.title);
        result.platform = os.platform() + " " + os.arch() + " " + os.release();
        result.memoryTotal = (os.totalmem() / 1024 / 1024).toFixed(0);
        result.memoryUsage = (100 -
            (os.freemem() / os.totalmem()) * 100).toFixed(0);
        result.cpuCores = os.cpus().length;
        // Get process memory stats.
        const processMemory = process.memoryUsage();
        result.process = {
            pid: process.pid,
            memoryUsed: (processMemory.rss / 1024 / 1024).toFixed(0),
            memoryHeapTotal: (processMemory.heapTotal / 1024 / 1024).toFixed(0),
            memoryHeapUsed: (processMemory.heapUsed / 1024 / 1024).toFixed(0)
        };
        // Calculate average CPU load.
        if (lastCpuLoad == null) {
            lastCpuLoad = this.getCpuLoad();
        }
        const currentCpuLoad = this.getCpuLoad();
        const idleDifference = currentCpuLoad.idle - lastCpuLoad.idle;
        const totalDifference = currentCpuLoad.total - lastCpuLoad.total;
        result.loadAvg = 100 - ~~((100 * idleDifference) / totalDifference);
        // Add labels to relevant metrics on the output?
        if (options.labels) {
            result.loadAvg += "%";
            result.memoryTotal += " MB";
            result.memoryUsage += "%";
            result.process.memoryUsed += " MB";
            result.process.memoryHeapTotal += " MB";
            result.process.memoryHeapUsed += " MB";
        }
        return result;
    }
    // Get current CPU load (used mainly by getServerInfo).
    // @return {Object} CPU load with idle and total ticks.
    getCpuLoad() {
        let totalIdle = 0;
        let totalTick = 0;
        const cpus = os.cpus();
        let i = 0;
        const len = cpus.length;
        while (i < len) {
            const cpu = cpus[i];
            for (let t in cpu.times) {
                const value = cpu.times[t];
                totalTick += value;
            }
            totalIdle += cpu.times.idle;
            i++;
        }
        return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
    }
}
module.exports = SystemUtils.Instance;
