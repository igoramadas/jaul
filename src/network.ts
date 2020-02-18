// JAUL: network.ts

/** @hidden */
import _ = require("lodash")
/** @hidden */
import ipaddr = require("ipaddr.js")
/** @hidden */
import os = require("os")

/** Network Utilities class. */
export class NetworkUtils {
    private static _instance: NetworkUtils
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Returns a list of valid server IPv4 and/or IPv6 addresses.
     * @param family IP family to be retrieved, can be "IPv4" or "IPv6".
     * @returns Array with the system's IP addresses, or empty.
     */
    getIP = (family: string): string[] => {
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
    getSingleIPv4 = (): string => {
        const ips = this.getIP("ipv4")

        if (ips && ips.length > 0) {
            return ips[0]
        }

        /* istanbul ignore next */
        return null
    }

    /**
     * Returns the first valid IPv6 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv6 address, or null.
     */
    getSingleIPv6 = (): string => {
        const ips = this.getIP("ipv6")

        if (ips && ips.length) {
            return ips[0]
        }

        /* istanbul ignore next */
        return null
    }

    /**
     * Get the client IP. Works for http and socket requests, even when behind a proxy.
     * @param reqOrSocket The request or socket object.
     * @returns The client IP address, or null if not identified.
     */
    getClientIP = (reqOrSocket: any): string => {
        if (reqOrSocket == null) {
            return null
        }

        // Try getting IP from headers first.
        if (reqOrSocket.get) {
            const xfor = reqOrSocket.get("X-Forwarded-For")
            if (xfor != null && xfor != "") {
                return xfor.split(",")[0]
            }

            const forwarded = reqOrSocket.get("Forwarded")
            if (forwarded != null && forwarded != "") {
                const arr = forwarded.split(";")
                for (let a of arr) {
                    if (a.indexOf("for=") >= 0) {
                        return a.replace("for=", "").trim()
                    }
                }
            }

            const xreal = reqOrSocket.get("X-Real-IP")
            if (xreal != null && xreal != "") {
                return xreal
            }
        }

        // Get remote address.
        if (reqOrSocket.connection && reqOrSocket.connection.remoteAddress) {
            return reqOrSocket.connection.remoteAddress
        } /* istanbul ignore next */ else if (reqOrSocket.handshake && reqOrSocket.handshake.address) {
            return reqOrSocket.handshake.address
        } /* istanbul ignore next */ else if (reqOrSocket.request && reqOrSocket.request.connection && reqOrSocket.request.connection.remoteAddress) {
            return reqOrSocket.request.connection.remoteAddress
        }

        return reqOrSocket.remoteAddress
    }

    /**
     * Check if a specific is in the provided range.
     * @param ip The IP to be checked (IPv4 or IPv6).
     * @param range A string or array of strings representing the valid ranges.
     * @returns True if IP is in range, false otherwise.
     */
    ipInRange = (ip: string, range: string[] | string): boolean => {
        if (_.isString(range)) {
            const ipParsed = ipaddr.parse(ip)

            // Range is a subnet? Then parse the IP address and check each block against the range.
            if (range.indexOf("/") >= 0) {
                try {
                    const rangeParsed = ipaddr.parseCIDR(range as string)
                    // @ts-ignore
                    return ipParsed.match(rangeParsed)
                } catch (err) {
                    return false
                }

                // Range is a single IP address.
            } else {
                return ip === range
            }
        } else if (_.isObject(range)) {
            // Array of IP ranges, check each one of them.v
            for (let r in range as string[]) {
                if (this.ipInRange(ip, range[r])) {
                    return true
                }
            }
        }

        return false
    }
}

// Exports...
export default NetworkUtils.Instance
