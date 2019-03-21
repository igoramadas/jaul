// TEST: DATA

var env = process.env
var chai = require("chai")
var mocha = require("mocha")
var describe = mocha.describe
var it = mocha.it
chai.should()

describe("JAUL Data tests", function() {
    env.NODE_ENV = "test"

    var jaul = require("../index")
    var lodash = require("lodash")

    it("Remove specified characters from string, passing as array", function(done) {
        var original = "ABC123"
        var removed = jaul.data.removeFromString(original, ["A", "1"])

        if (removed == "BC23") {
            done()
        } else {
            done("Expected BC23, got " + removed)
        }
    })

    it("Remove specified characters from string, passing as string", function(done) {
        var original = "ABC123"
        var removed = jaul.data.removeFromString(original, "ABC")

        if (removed == "123") {
            done()
        } else {
            done("Expected 123, got " + removed)
        }
    })

    it("Try removing characters from null string", function(done) {
        var removed = jaul.data.removeFromString(null, ["A", "1"])

        if (removed == null) {
            done()
        } else {
            done("Expected 'null', got " + removed)
        }
    })

    it("Mask password with defaults", function(done) {
        var original = "password"
        var masked = jaul.data.maskString(original)

        if (masked == "********") {
            done()
        } else {
            done("Expected '********', got '" + masked + "'.")
        }
    })

    it("Mask a phone number", function(done) {
        var original = "176 55555 9090"
        var masked = jaul.data.maskString(original, "X", 4)

        if (masked == "XXX XXXXX 9090") {
            done()
        } else {
            done("Expected '*** ***** 9090', got '" + masked + "'.")
        }
    })

    it("Mask invalid data should return data itself", function(done) {
        var original = null
        var masked = jaul.data.maskString(null)

        if (original == masked) {
            done()
        } else {
            done("Original and masked values are not the same.")
        }
    })

    it("Minify a JSON string, returning as JSON object", function(done) {
        var original = '{"something": true} //comments here'

        var minified = jaul.data.minifyJson(original)
        var minifiedCompare = '{"something":true}'

        if (minified.something && JSON.stringify(minified, null, 0) == minifiedCompare) {
            done()
        } else {
            done("JSON object was not minified properly.")
        }
    })

    it("Minify a JSON object, returning as string", function(done) {
        var original = {
            first: true,
            second: false,
            third: 0
        }

        var minified = jaul.data.minifyJson(JSON.stringify(original), true)
        var minifiedCompare = '{"first":true,"second":false,"third":0}'

        if (minified == minifiedCompare || minified == minifiedCompare.replace(/['"]+/g, "")) {
            done()
        } else {
            done("JSON object was not minified properly.")
        }
    })

    it("Fail minifying a 'dirty' JSON string with invalid comments", function(done) {
        var original = "" + " /* comment here // " + " { first: true } // "

        try {
            var minified = jaul.data.minifyJson(original, true)
            done("Minifying an invalid JSON should throw an exception.")
        } catch (ex) {
            done()
        }
    })

    it("Generate unique IDs", function(done) {
        var ids = []
        var max = 500
        var i

        for (i = 0; i < max; i++) {
            ids.push(jaul.data.uuid())
        }

        var noduplicates = lodash.uniq(ids)

        if (noduplicates.length == max) {
            done()
        } else {
            done("Out of " + max + ", " + max - noduplicates.length + " of the generated IDs were not unique.")
        }
    })
})
