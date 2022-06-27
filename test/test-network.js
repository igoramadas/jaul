// TEST: NETWORK

let chai = require("chai")
let express = require("express")
let mocha = require("mocha")
let after = mocha.after
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("JAUL Network Tests", function () {
    let port = null
    let jaul = null
    let app = null
    let server = null
    let supertest = null

    before(async function () {
        jaul = require("../lib/index")

        let getPort = await import("get-port")
        port = await getPort.default(3000)

        app = express()
        server = app.listen(port)
        supertest = require("supertest").agent(app)

        app.get("/", function (req, res) {
            let ip = jaul.network.getClientIP(req)
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
        done()
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

    it("Get valid IP from browser", function (done) {
        supertest.get("/").expect(200, done)
    })

    it("Get valid IP from X-Forwarded-For header", function (done) {
        let body = {
            ip: "10.1.2.3"
        }

        supertest.get("/").set("X-Forwarded-For", "10.1.2.3").expect(200, body, done)
    })

    it("Get valid IP from socket connection", function (done) {
        let options = {
            transports: ["websocket"],
            forceNew: true,
            reconnection: false
        }

        let socketIO = require("socket.io-client")
        let sender = socketIO(`http://localhost:${port}`, options)
        let receiver = socketIO(`http://localhost:${port}`, options)
        let called = false

        app.use(function (req, res, next) {
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
