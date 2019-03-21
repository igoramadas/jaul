// TEST: NETWORK

var env = process.env
var chai = require("chai")
var mocha = require("mocha")
var describe = mocha.describe
var it = mocha.it
chai.should()

describe("JAUL Network Tests", function() {
    env.NODE_ENV = "test"

    var jaul = require("../index")

    it("Gets current IPV4", function(done) {
        var ip = jaul.network.getSingleIPv4()

        if (ip) {
            done()
        } else {
            done("The getSingleIPv4() did not return a valid IP")
        }
    })

    it("Gets current IPV6", function(done) {
        var ip = jaul.network.getSingleIPv6()

        if (ip) {
            done()
        } else {
            done("The getSingleIPv6() did not return a valid IP")
        }
    })

    it("Check IP against multiple ranges", function(done) {
        var ip = "192.168.1.1"
        var validIP = "192.168.1.1"
        var validRange = "192.168.1.0/24"
        var validRangeArray = ["192.168.1.0/24", "192.168.0.0/16"]
        var invalidRange = "10.1.1.0/16"

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

    it("Check IP against invalid range", function(done) {
        var ip = "192.168.1.1"

        if (jaul.network.ipInRange(ip, null)) {
            done("Should have returned false for range null.")
        } else if (jaul.network.ipInRange(ip, "/a./a")) {
            done("Should have returned false for invalid range.")
        } else {
            done()
        }
    })
})
