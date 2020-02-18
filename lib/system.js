"use strict";
const moment = require("moment");
const os = require("os");
const path = require("path");
let lastCpuLoad = null;
class SystemUtils {
    static getInfo(options) {
        if (options == null) {
            options = { labels: true };
        }
        let result = {};
        result.uptime = moment.duration(process.uptime(), "s").humanize();
        result.hostname = os.hostname();
        result.title = path.basename(process.title);
        result.platform = os.platform() + " " + os.arch() + " " + os.release();
        result.memoryTotal = (os.totalmem() / 1024 / 1024).toFixed(0);
        result.memoryUsage = (100 - (os.freemem() / os.totalmem()) * 100).toFixed(0);
        result.cpuCores = os.cpus().length;
        const processMemory = process.memoryUsage();
        result.process = {
            pid: process.pid,
            memoryUsed: (processMemory.rss / 1024 / 1024).toFixed(0),
            memoryHeapTotal: (processMemory.heapTotal / 1024 / 1024).toFixed(0),
            memoryHeapUsed: (processMemory.heapUsed / 1024 / 1024).toFixed(0)
        };
        if (lastCpuLoad == null) {
            lastCpuLoad = this.getCpuLoad();
        }
        const currentCpuLoad = this.getCpuLoad();
        const idleDifference = currentCpuLoad.idle - lastCpuLoad.idle;
        const totalDifference = currentCpuLoad.total - lastCpuLoad.total;
        result.loadAvg = 100 - ~~((100 * idleDifference) / totalDifference);
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
    static getCpuLoad() {
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
module.exports = SystemUtils;
