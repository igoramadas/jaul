// JAUL: network.ts

import {BlockList, isIP} from "node:net"
import ipaddr from "./ipaddr"
import os from "os"

/**
 * Network Utilities
 */
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
    getIP = (family?: "IPv4" | "IPv6"): string[] => {
        return Object.values(os.networkInterfaces()).flatMap((interfaces) => (interfaces ?? []).filter((details) => !details.internal && (!family || details.family === family)).map((details) => details.address))
    }
    /**
     * Returns the first valid IPv4 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv4 address, or null.
     */
    getSingleIPv4 = (): string => {
        return this.getIP("IPv4")[0] ?? null
    }

    /**
     * Returns the first valid IPv6 address found on the system, or null if no valid IPs were found.
     * @returns First valid IPv6 address, or null.
     */
    getSingleIPv6 = (): string => {
        return this.getIP("IPv6")[0] ?? null
    }

    /**
     * Get the client IP. Works for http and socket requests, even when behind a proxy.
     * @param reqOrSocket The request or socket object.
     * @param cfCheck Check CF-Connecting-IP (Cloudflare header)first when true. Defaults to false.
     * @returns The client IP address, or null if not identified.
     */
    getClientIP = (reqOrSocket: any, cfCheck: boolean = false): string | null => {
        if (reqOrSocket == null) {
            return null
        }

        // Check Cloudflare header?
        if (cfCheck === true) {
            const cloudflare = reqOrSocket.get?.("CF-Connecting-IP") || reqOrSocket.headers?.["cf-connecting-ip"]
            if (typeof cloudflare === "string" && cloudflare.trim()) {
                return cloudflare.trim()
            }
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
        if (Array.isArray(range)) {
            return range.some((candidate) => this.ipInRange(ip, candidate))
        }

        if (typeof range == "string") {
            const address = isIP(ip) ? ip : ipaddr.parse(ip).toString()

            if (range.indexOf("/") >= 0) {
                try {
                    const parts = range.split("/")
                    if (parts.length !== 2 || !/^\d+$/.test(parts[1])) {
                        return false
                    }
                    const subnet = isIP(parts[0]) ? parts[0] : ipaddr.parse(parts[0]).toString()
                    if (isIP(address) !== isIP(subnet)) {
                        return false
                    }
                    const family = isIP(address) === 6 ? "ipv6" : "ipv4"
                    const blockList = new BlockList()
                    blockList.addSubnet(subnet, Number(parts[1]), family)
                    return blockList.check(address, family)
                } catch (err) {
                    return false
                }
            } else {
                return ip === range
            }
        }

        return false
    }
}

// Exports...
export default NetworkUtils.Instance
