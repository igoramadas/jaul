declare class NetworkUtils {
    static getIP(family: string): string[];
    static getSingleIPv4(): string;
    static getSingleIPv6(): string;
    static getClientIP(reqOrSocket: any): string;
    static ipInRange(ip: string, range: string[] | string): boolean;
}
export = NetworkUtils;
