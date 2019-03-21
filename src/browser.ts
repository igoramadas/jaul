/**
 * JAUL: Browser utilities
 */

class BrowserUtils {
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
}

// Exports singleton.
export = BrowserUtils
