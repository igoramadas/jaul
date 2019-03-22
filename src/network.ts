/**
 * JAUL: Network utilities
 */

const _ = require("lodash")
const ipaddr = require("ipaddr.js")
const os = require("os")

class NetworkUtils {
    /**
     * Returns a list of valid server IPv4 and/or IPv6 addresses.
     * @param family IP family to be retrieved, can be "IPv4" or "IPv6".
     * @returns Array with the system's IP addresses, or empty.
     */
    static getIP(family: string): string[] {
        const result = []
        let ifaces = os.networkInterfaces()

        if (family) {
            family = family.toLowerCase()
        }

        // Parse network interfaces and try getting the valid IP addresses.
        for (let i in ifaces) {
            ifaces[i].forEach(function(details) {
                if (!details.internal && (family == null || details.family.toLowerCase() == family)) {
                    return result.push(details.address)
                }
            })
        }

        return result
    }
    /**
     * Returns the first valid IPv4 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv4 address, or null.
     */
    static getSingleIPv4(): string {
        const ips = this.getIP("ipv4")

        if ((ips != null ? ips.length : undefined) > 0) {
            return ips[0]
        }

        return null
    }

    /**
     * Returns the first valid IPv6 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv6 address, or null.
     */
    static getSingleIPv6(): string {
        const ips = this.getIP("ipv6")

        if ((ips != null ? ips.length : undefined) > 0) {
            return ips[0]
        }

        return null
    }

    /**
     * Get the client IP. Works for http and socket requests, even when behind a proxy.
     * @param reqOrSocket The request or socket object.
     * @returns The client IP address, or null if not identified.
     */
    static getClientIP(reqOrSocket: any): string {
        if (reqOrSocket == null) {
            return null
        }

        // Try getting the xforwarded header first.
        if (reqOrSocket.header != null) {
            const xfor = reqOrSocket.header("X-Forwarded-For")
            if (xfor != null && xfor != "") {
                return xfor.split(",")[0]
            }
        }

        // Get remote address.
        if (reqOrSocket.connection && reqOrSocket.connection.remoteAddress) {
            return reqOrSocket.connection.remoteAddress
        } else if (reqOrSocket.handshake && reqOrSocket.handshake.address) {
            return reqOrSocket.handshake.address
        } else if (reqOrSocket.request && reqOrSocket.request.connection && reqOrSocket.request.connection.remoteAddress) {
            return reqOrSocket.request.connection.remoteAddress
        }

        return reqOrSocket.remoteAddress
    }

    /**
     * Check if a specific IP is in the provided range.
     * @param ip The IP to be checked (IPv4 or IPv6).
     * @param range A string or array of strings representing the valid ranges.
     * @returns True if IP is in range, false otherwise.
     */
    static ipInRange(ip: string, range: string[] | string): boolean {
        if (_.isString(range)) {
            const ipParsed = ipaddr.parse(ip)

            // Range is a subnet? Then parse the IP address and check each block against the range.
            if (range.indexOf("/") >= 0) {
                try {
                    const rangeArr = (range as string).split("/")
                    const rangeParsed = ipaddr.parse(rangeArr[0])

                    return ipParsed.match(rangeParsed, rangeArr[1])
                } catch (err) {
                    return false
                }

                // Range is a single IP address.
            } else {
                return ip === range
            }
        } else if (_.isObject(range)) {
            // Array of IP ranges, check each one of them.
            for (let r in range as string[]) {
                if (this.ipInRange(ip, range[r])) {
                    return true
                }
            }
        }

        return false
    }
}

// Exports singleton.
export = NetworkUtils
