// TEST: NETWORK

import {after, before, describe, it} from "mocha"
import assert = require("node:assert/strict")
require("chai").should()

describe("JAUL Network Tests", function () {
    let express = require("express")

    let port = null
    let jaul = null
    let app = null
    let server = null
    let supertest = null

    before(async function () {
        jaul = require("../src/index")

        let getPort = await import("get-port")
        port = await getPort.default({port: 3000})

        app = express()
        server = app.listen(port)
        supertest = require("supertest").agent(app)

        app.get("/", function (req, res) {
            let ip = jaul.network.getClientIP(req, req.query.cfCheck === "true")
            res.json({
                ip: ip
            })
        })
    })

    after(function () {
        server.close()
    })

    it("Gets current IPV4", function (done) {
        let ip = jaul.network.getSingleIPv4()

        if (ip) {
            done()
        } else {
            done("The getSingleIPv4() did not return a valid IP")
        }
    })

    it("Gets current IPV6", function (done) {
        let ip = jaul.network.getSingleIPv6()

        if (ip) {
            done()
        } else {
            done("The getSingleIPv6() did not return a valid IP")
        }
    })

    it("Check IP against multiple ranges", function (done) {
        let ip = "192.168.1.1"
        let validIP = "192.168.1.1"
        let validRange = "192.168.1.0/24"
        let validRangeArray = ["192.168.1.0/24", "192.168.0.0/16"]
        let invalidRange = "10.1.1.0/16"

        if (!jaul.network.ipInRange(ip, validIP)) {
            done("IP " + ip + " should be valid against " + validIP + ".")
        } else if (!jaul.network.ipInRange(ip, validRange)) {
            done("IP " + ip + " should be valid against " + validRange + ".")
        } else if (!jaul.network.ipInRange(ip, validRangeArray)) {
            done("IP " + ip + " should be valid against " + validRangeArray.join(", ") + ".")
        } else if (!jaul.network.ipInRange(ip, validIP)) {
            done("IP " + ip + " should be invalid against " + invalidRange + ".")
        } else {
            done()
        }
    })

    it("Check IP against invalid range", function (done) {
        let ip = "192.168.1.1"

        if (jaul.network.ipInRange(ip, null)) {
            done("Should have returned false for range null.")
        } else if (jaul.network.ipInRange(ip, "/a./a")) {
            done("Should have returned false for invalid range.")
        } else {
            done()
        }
    })

    it("Matches IPv6 subnets and rejects mixed families", function () {
        assert.equal(jaul.network.ipInRange("2001:db8::1", "2001:db8::/32"), true)
        assert.equal(jaul.network.ipInRange("2001:db9::1", "2001:db8::/32"), false)
        assert.equal(jaul.network.ipInRange("::ffff:192.168.1.1", "192.168.1.0/24"), false)
        assert.equal(jaul.network.ipInRange("192.168.1.1", "::ffff:192.168.1.0/120"), false)
    })

    it("Preserves legacy IPv4 syntax and literal address comparisons", function () {
        assert.equal(jaul.network.ipInRange("127.1", "127.0.0.0/8"), true)
        assert.equal(jaul.network.ipInRange("192.168.1.1", "0xc0.0250.1.0/24"), true)
        assert.equal(jaul.network.ipInRange("2001:db8::1", "2001:0db8::1"), false)
    })

    it("Handles subnet boundaries, invalid ranges and arrays", function () {
        assert.equal(jaul.network.ipInRange("192.168.1.1", "0.0.0.0/0"), true)
        assert.equal(jaul.network.ipInRange("192.168.1.1", "192.168.1.1/32"), true)
        assert.equal(jaul.network.ipInRange("::1", "::1/128"), true)
        for (const range of ["192.168.1.0/33", "::/129", "192.168.1.0/-1", "192.168.1.0/24/1", "192.168.1.0/"]) {
            assert.equal(jaul.network.ipInRange("192.168.1.1", range), false)
        }
        assert.equal(jaul.network.ipInRange("192.168.1.1", ["10.0.0.0/8", "192.168.1.0/24"]), true)
        assert.equal(jaul.network.ipInRange("192.168.1.1", []), false)
        assert.throws(() => jaul.network.ipInRange("invalid", "192.168.1.0/24"))
    })

    it("Get valid IP from browser", function (done) {
        supertest.get("/").expect(200, done)
    })

    it("Get valid IP from X-Forwarded-For header", function (done) {
        let body = {
            ip: "10.1.2.3"
        }

        supertest.get("/").set("X-Forwarded-For", "10.1.2.3").expect(200, body, done)
    })

    it("Prefers CF-Connecting-IP over other proxy headers", function (done) {
        supertest.get("/?cfCheck=true").set("CF-Connecting-IP", "203.0.113.1").set("X-Forwarded-For", "10.1.2.3").set("X-Real-IP", "10.2.3.4").expect(200, {ip: "203.0.113.1"}, done)
    })

    it("Reads CF-Connecting-IP from plain HTTP request headers", function () {
        assert.equal(jaul.network.getClientIP({headers: {"cf-connecting-ip": " 2001:db8::1 "}, remoteAddress: "127.0.0.1"}, true), "2001:db8::1")
    })

    it("Ignores CF-Connecting-IP unless cfCheck is true", function () {
        const request = {headers: {"cf-connecting-ip": "203.0.113.1"}, remoteAddress: "127.0.0.1"}
        assert.equal(jaul.network.getClientIP(request), "127.0.0.1")
        assert.equal(jaul.network.getClientIP(request, false), "127.0.0.1")

        const expressRequest = {get: (name) => ({"CF-Connecting-IP": "203.0.113.1", "X-Forwarded-For": "10.1.2.3"})[name]}
        assert.equal(jaul.network.getClientIP(expressRequest), "10.1.2.3")
        assert.equal(jaul.network.getClientIP(expressRequest, false), "10.1.2.3")
    })

    it("Falls back when CF-Connecting-IP is empty or not a string", function () {
        for (const header of [undefined, "", "   ", ["203.0.113.1"]]) {
            assert.equal(jaul.network.getClientIP({headers: {"cf-connecting-ip": header}, remoteAddress: "127.0.0.1"}, true), "127.0.0.1")
        }
        assert.equal(jaul.network.getClientIP({get: (name) => (name === "X-Forwarded-For" ? "10.1.2.3" : "")}, true), "10.1.2.3")
    })

    it("Get valid IP from socket connection", function (done) {
        let options = {
            transports: ["websocket"],
            forceNew: true,
            reconnection: false
        }

        let socketIO = require("socket.io-client")
        let sender = socketIO(`http://localhost:${port}`, options)
        socketIO(`http://localhost:${port}`, options)
        let called = false

        app.use(function (req, _res, _next) {
            if (!called) {
                if (req.path.indexOf("socket.io") >= 0) {
                    called = true
                    let clientIP = jaul.network.getClientIP(req)
                    if (clientIP) {
                        done()
                    } else {
                        done("Could not fetch IP from socket connection.")
                    }
                }
            }
        })

        sender.emit("message", "abc")
    })

    it("Fails to get IP from invalid objects", function (done) {
        let ip = jaul.network.getClientIP("invalid")

        if (ip != null) {
            done("The getClientIP() passing a string should return null")
        }

        ip = jaul.network.getClientIP(null)

        if (ip != null) {
            done("The getClientIP() passing a null should return null")
        }

        done()
    })
})
