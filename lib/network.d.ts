/** Network Utilities class. */
declare class NetworkUtils {
    /**
     * Returns a list of valid server IPv4 and/or IPv6 addresses.
     * @param family IP family to be retrieved, can be "IPv4" or "IPv6".
     * @returns Array with the system's IP addresses, or empty.
     */
    static getIP(family: string): string[];
    /**
     * Returns the first valid IPv4 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv4 address, or null.
     */
    static getSingleIPv4(): string;
    /**
     * Returns the first valid IPv6 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv6 address, or null.
     */
    static getSingleIPv6(): string;
    /**
     * Get the client IP. Works for http and socket requests, even when behind a proxy.
     * @param reqOrSocket The request or socket object.
     * @returns The client IP address, or null if not identified.
     */
    static getClientIP(reqOrSocket: any): string;
    /**
     * Check if a specific IP is in the provided range.
     * @param ip The IP to be checked (IPv4 or IPv6).
     * @param range A string or array of strings representing the valid ranges.
     * @returns True if IP is in range, false otherwise.
     */
    static ipInRange(ip: string, range: string[] | string): boolean;
}
export = NetworkUtils;
