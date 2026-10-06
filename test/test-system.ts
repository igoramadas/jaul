// TEST: SYSTEM

import {before, describe, it} from "mocha"
require("chai").should()

describe("JAUL System Tests", function () {
    let jaul = null

    before(function () {
        jaul = require("../src/index")
    })

    it("Get valid server info", function (done) {
        let serverInfo = jaul.system.getInfo()

        if (serverInfo.cpuCores > 0) {
            done()
        } else {
            done("Could not get CPU core count from server info result.")
        }
    })

    it("Humanizes uptime in seconds, minutes, hours and days", function () {
        const uptime = process.uptime

        try {
            const expected = {30: "30 seconds", 300: "5.0 minutes", 9000: "2.5 hours", 432000: "5.0 days"}
            for (const [seconds, label] of Object.entries(expected)) {
                process.uptime = () => Number(seconds)
                jaul.system.getInfo().uptime.should.equal(label)
            }
        } finally {
            process.uptime = uptime
        }
    })

    it("Creates new JAUL instances", function () {
        const instance = jaul.newInstance()
        instance.should.not.equal(jaul)
        instance.system.should.equal(jaul.system)
    })

    it("Get server info without labels", function (done) {
        let serverInfo = jaul.system.getInfo({
            labels: false
        })

        if (serverInfo.memoryUsage.toString().indexOf("%") > 0 || serverInfo.memoryTotal.toString().indexOf("MB") > 0) {
            done("Output should not include labels % MB etc.")
        } else {
            done()
        }
    })
})
