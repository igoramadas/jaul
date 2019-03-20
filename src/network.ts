/*
 * JAUL: Network utilities
 */

const _ = require("lodash")
const ipaddr = require("ipaddr.js")
const os = require("os")

class NetworkUtils {
    private static _instance: NetworkUtils
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /*
     * Returns a list of valid server IPv4 and/or IPv6 addresses.
     * @param family - IP family to be retrieved, can be "IPv4" or "IPv6".
     * @returns Array with the system's IP addresses, or empty.
     */
    getIP(family: string) {
        let ifaces
        const result = []

        ifaces = os.networkInterfaces()

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
    /*
     * Returns the first valid IPv4 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv4 address, or null.
     */
    getSingleIPv4() {
        const ips = this.getIP("ipv4")

        if ((ips != null ? ips.length : undefined) > 0) {
            return ips[0]
        }

        return null
    }

    /*
     * Returns the first valid IPv6 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv6 address, or null.
     */
    getSingleIPv6() {
        const ips = this.getIP("ipv6")

        if ((ips != null ? ips.length : undefined) > 0) {
            return ips[0]
        }

        return null
    }

    /*
     * Check if a specific IP is in the provided range.
     * @param ip - The IP to be checked (IPv4 or IPv6).
     * @param range - A string or array of strings representing the valid ranges.
     * @returns True if IP is in range, false otherwise.
     */
    ipInRange(ip: string, range: string[] | string) {
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
export = NetworkUtils.Instance
