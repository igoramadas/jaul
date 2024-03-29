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
