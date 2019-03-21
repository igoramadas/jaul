// TEST: DATA

var env = process.env
var chai = require("chai")
var mocha = require("mocha")
var after = mocha.after
var before = mocha.before
var describe = mocha.describe
var it = mocha.it
chai.should()

describe("JAUL Data tests", function() {
    env.NODE_ENV = "test"

    var express = require("express")
    var jaul = require("../index")

    var app = null
    var server = null
    var supertest = null

    before(function() {
        app = express()
        server = app.listen(7481)
        supertest = require("supertest").agent(app)

        app.get("/", function(req, res) {
            let ip = jaul.browser.getClientIP(req)
            res.json({
                ip: ip
            })
        })
    })

    after(function() {
        server.close()
    })

    it("Get valid IP from browser", function(done) {
        supertest.get("/").expect(200, done)
    })

    it("Get valid IP from X-Forwarded-For header", function(done) {
        var body = {
            ip: "10.1.2.3"
        }

        supertest.get("/").set("X-Forwarded-For", "10.1.2.3").expect(200, body, done)
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
