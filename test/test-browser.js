// TEST: DATA

var env = process.env
var chai = require("chai")
var mocha = require("mocha")
var after = mocha.after
var describe = mocha.describe
var it = mocha.it
chai.should()

describe("JAUL Data tests", function() {
    env.NODE_ENV = "test"

    var express = require("express")
    var jaul = require("../index")
    var server = null

    after(function() {
        server.close()
    })

    it("Get valid IP from browser", function(done) {
        let app = express()

        app.get("/", function(req, res) {
            let ip = jaul.browser.getClientIP(req)
            res.send('Hello World')
        })

        server = app.listen(7481)

        var supertest = require("supertest").agent(app)
        supertest.get("/").expect(200, done)
    })

    it("Fails to get IP from invalid objects", function(done) {
        var ip = jaul.browser.getClientIP("invalid")

        if (ip != null) {
            done("The getClientIP() passing a string should return null")
        }

        ip = jaul.browser.getClientIP(null)

        if (ip != null) {
            done("The getClientIP() passing a null should return null")
        }

        done()
    })
})
