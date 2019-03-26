/**
 * JAUL: System utilities
 */
/** Options for {@link SystemUtils.getInfo} */
interface GetInfoOptions {
    /** If false, labels won't be added to the output (%, MB, etc). Default is true. */
    labels: boolean;
}
interface SystemMetrics {
    /** System uptime as human readable string. */
    uptime: string;
    /** System hostname. */
    hostname: string;
    /** Process title. */
    title: string;
    /** System platform name. */
    platform: string;
    /** Total memory available. */
    memoryTotal: any;
    /** Current memory usage. */
    memoryUsage: any;
    /** CPU load average. */
    loadAvg: any;
    /** Number of CPU cores. */
    cpuCores: number;
    /** Process details. */
    process: any;
}
interface CpuLoad {
    /** Idle counter */
    idle: number;
    /** Total counter */
    total: number;
}
declare class SystemUtils {
    /**
     * Return an object with general and health information about the system.
     * @param options - Options to define the output.
     * @returns Object with system metrics attached.
     */
    static getInfo(options: GetInfoOptions): SystemMetrics;
    /**
     * Get current CPU load, used by getInfo().
     * @returns CPU load information with idle and total counters.
     */
    static getCpuLoad(): CpuLoad;
}
export = SystemUtils;