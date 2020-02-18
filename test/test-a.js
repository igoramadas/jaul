// TEST: MAIN

let chai = require("chai")
let lodash = require("lodash")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("JAUL Main tests", function() {
    let jaul = null

    before(function() {
        jaul = require("../lib/index")
    })

    it("Version available", function(done) {
        if (jaul.version) {
            done()
        } else {
            done("The index should have a .version set.")
        }
    })
})
