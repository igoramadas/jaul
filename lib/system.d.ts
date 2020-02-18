interface GetInfoOptions {
    labels: boolean;
}
interface SystemMetrics {
    uptime: string;
    hostname: string;
    title: string;
    platform: string;
    memoryTotal: any;
    memoryUsage: any;
    loadAvg: any;
    cpuCores: number;
    process: any;
}
interface CpuLoad {
    idle: number;
    total: number;
}
declare class SystemUtils {
    static getInfo(options: GetInfoOptions): SystemMetrics;
    static getCpuLoad(): CpuLoad;
}
export = SystemUtils;
