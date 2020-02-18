"use strict";
const _ = require("lodash");
const ipaddr = require("ipaddr.js");
const os = require("os");
class NetworkUtils {
    static getIP(family) {
        const result = [];
        let ifaces = os.networkInterfaces();
        if (family) {
            family = family.toLowerCase();
        }
        for (let i in ifaces) {
            ifaces[i].forEach(function (details) {
                if (!details.internal && (family == null || details.family.toLowerCase() == family)) {
                    return result.push(details.address);
                }
            });
        }
        return result;
    }
    static getSingleIPv4() {
        const ips = this.getIP("ipv4");
        if (ips && ips.length > 0) {
            return ips[0];
        }
        return null;
    }
    static getSingleIPv6() {
        const ips = this.getIP("ipv6");
        if (ips && ips.length) {
            return ips[0];
        }
        return null;
    }
    static getClientIP(reqOrSocket) {
        if (reqOrSocket == null) {
            return null;
        }
        if (reqOrSocket.get) {
            const xfor = reqOrSocket.get("X-Forwarded-For");
            if (xfor != null && xfor != "") {
                return xfor.split(",")[0];
            }
            const forwarded = reqOrSocket.get("Forwarded");
            if (forwarded != null && forwarded != "") {
                const arr = forwarded.split(";");
                for (let a of arr) {
                    if (a.indexOf("for=") >= 0) {
                        return a.replace("for=", "").trim();
                    }
                }
            }
            const xreal = reqOrSocket.get("X-Real-IP");
            if (xreal != null && xreal != "") {
                return xreal;
            }
        }
        if (reqOrSocket.connection && reqOrSocket.connection.remoteAddress) {
            return reqOrSocket.connection.remoteAddress;
        }
        else if (reqOrSocket.handshake && reqOrSocket.handshake.address) {
            return reqOrSocket.handshake.address;
        }
        else if (reqOrSocket.request && reqOrSocket.request.connection && reqOrSocket.request.connection.remoteAddress) {
            return reqOrSocket.request.connection.remoteAddress;
        }
        return reqOrSocket.remoteAddress;
    }
    static ipInRange(ip, range) {
        if (_.isString(range)) {
            const ipParsed = ipaddr.parse(ip);
            if (range.indexOf("/") >= 0) {
                try {
                    const rangeParsed = ipaddr.parseCIDR(range);
                    return ipParsed.match(rangeParsed);
                }
                catch (err) {
                    return false;
                }
            }
            else {
                return ip === range;
            }
        }
        else if (_.isObject(range)) {
            for (let r in range) {
                if (this.ipInRange(ip, range[r])) {
                    return true;
                }
            }
        }
        return false;
    }
}
module.exports = NetworkUtils;
