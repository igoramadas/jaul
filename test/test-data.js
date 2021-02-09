// TEST: DATA

let chai = require("chai")
let lodash = require("lodash")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("JAUL Data tests", function () {
    let jaul = null

    before(function () {
        jaul = require("../lib/index")
    })

    it("Remove specified characters from string, passing as array", function (done) {
        let original = "ABC123"
        let removed = jaul.data.removeFromString(original, ["A", "1"])

        if (removed == "BC23") {
            done()
        } else {
            done("Expected BC23, got " + removed)
        }
    })

    it("Remove specified characters from string, passing as string", function (done) {
        let original = "ABC123"
        let removed = jaul.data.removeFromString(original, "ABC")

        if (removed == "123") {
            done()
        } else {
            done("Expected 123, got " + removed)
        }
    })

    it("Try removing characters from null string", function (done) {
        let removed = jaul.data.removeFromString(null, ["A", "1"])

        if (removed == null) {
            done()
        } else {
            done("Expected 'null', got " + removed)
        }
    })

    it("Replace tags on text with values from object", function (done) {
        let empty = jaul.data.replaceTags(null, {a: 1})
        if (empty !== "") {
            return done("Calling replaceTags() passing a null value should return an empty string")
        }

        let noObj = jaul.data.replaceTags("Nothing to ${replace}", null)
        if (noObj !== "Nothing to ${replace}") {
            return done("Calling replaceTags() passing no object should return the text itself")
        }

        let expected = "This is a test"
        let text = jaul.data.replaceTags("This ${a} a ${b}", {a: "is", b: "test"})
        if (text != expected) {
            return done(`Expected "${expected}", but got "${text}"`)
        }

        done()
    })

    it("Replace tags, with a prefix", function (done) {
        let expected = "This is a test"
        let text = jaul.data.replaceTags("This ${hello.a} a ${hello.b}", {a: "is", b: "test"}, "hello.")
        if (text != expected) {
            return done(`Expected "${expected}", but got "${text}"`)
        }

        done()
    })

    it("Replacing prefixed tags should not touch unprefixed tags", function (done) {
        let expected = "a b c d"
        let text = "${hello.a} ${hello.b} ${c} ${another.d}"
        text = jaul.data.replaceTags(text, {a: "a", b: "b"}, "hello.")
        text = jaul.data.replaceTags(text, {c: "c"})
        text = jaul.data.replaceTags(text, {d: "d"}, "another.")

        if (text != expected) {
            return done(`Expected "${expected}", but got "${text}"`)
        }

        done()
    })

    it("Replace null tag, should return empty string", function (done) {
        let expected = "Hello "
        let text = jaul.data.replaceTags("Hello ${a}", {a: null})
        if (text != expected) {
            return done(`Expected "${expected}", but got "${text}"`)
        }

        done()
    })

    it("Mask password with defaults", function (done) {
        let original = "password"
        let masked = jaul.data.maskString(original)

        if (masked == "********") {
            done()
        } else {
            done("Expected '********', got '" + masked + "'.")
        }
    })

    it("Mask a phone number", function (done) {
        let original = "176 55555 9090"
        let masked = jaul.data.maskString(original, "X", 4)

        if (masked == "XXX XXXXX 9090") {
            done()
        } else {
            done("Expected '*** ***** 9090', got '" + masked + "'.")
        }
    })

    it("Mask invalid data should return data itself", function (done) {
        let original = null
        let masked = jaul.data.maskString(null)

        if (original == masked) {
            done()
        } else {
            done("Original and masked values are not the same.")
        }
    })

    it("Minify a JSON string with comments, returning as JSON object", function (done) {
        let original = `
        /* This is a multiline \\
        comment */
        {
            "something": true,
            "somethingElse":   " space ", //comments here
            "another": "\/escaped"
            // end
            /* Multiline comment

            * something else
            */
        }
        /*
        // More inline
        */
        `

        let minified = jaul.data.minifyJson(original)
        let minifiedCompare = '"something":true,"somethingElse":" space "'

        if (minified.something && JSON.stringify(minified, null, 0).indexOf(minifiedCompare) > 0) {
            done()
        } else {
            done("JSON object was not minified properly.")
        }
    })

    it("Minify a JSON object, returning as string", function (done) {
        let original = {
            first: true,
            second: false,
            third: 0
        }

        let minified = jaul.data.minifyJson(original, true)
        let minifiedCompare = '{"first":true,"second":false,"third":0}'

        if (minified == minifiedCompare || minified == minifiedCompare.replace(/['"]+/g, "")) {
            done()
        } else {
            done("JSON object was not minified properly.")
        }
    })

    it("Fail minifying 'dirty' JSON strings", function (done) {
        try {
            jaul.data.minifyJson(`{ "unterminated:{}}} "{//}"`)
            done("Minifying an invalid JSON should throw an exception (unterminated string).")
        } catch (ex) {
            // do nothing
        }

        try {
            jaul.data.minifyJson(`/* unterminated block comment {"something": true} /* unterminated block comment`)
            done("Minifying an invalid JSON should throw an exception (unterminated block comment).")
        } catch (ex) {
            // do nothing
        }

        try {
            jaul.data.minifyJson(`" test`)
            done("Minifying an invalid JSON should throw an exception (unterminated string).")
        } catch (ex) {
            // do nothing
        }

        try {
            jaul.data.minifyJson(`{"something": /invalid comment // invalid comment`)
            done("Minifying an invalid JSON should throw an exception (invalid comment).")
        } catch (ex) {
            done()
        }
    })

    it("Strips tags replace on HTML with comments", function (done) {
        let text = jaul.data.stripHtml("")

        if (text !== "") {
            return done("Stripping from empty string should return another empty string.")
        }

        let html = `
<!–– Some - comment -->
<!–– - Comment with <tags> -->
<div class="a">This</div>'is'<b disabled='1'>a</b><
test`

        const expected = "This 'is' a < test"
        text = jaul.data.stripHtml(html).trim()

        if (text == expected) {
            done()
        } else {
            done(`Stripping result should be (${expected}), but got (${text}).`)
        }
    })

    it("Strips tags from valid HTML, replacing with empty string", function (done) {
        let html1 = `<body><div>This</div><br><br /><br><p>And body</p><footer>Free from tags!</footer><<>></body>`
        let html2 = `<div>This</div><br><p>And body</p><strong><br />Free from tags!</strong>`
        let text1 = jaul.data.stripHtml(html1, "")
        let text2 = jaul.data.stripHtml(html2, "")

        if (text1 == text2) {
            done()
        } else {
            done("The 2 HTML values should return the same text after sstripping the tags.")
        }
    })

    it("Generate unique IDs", function (done) {
        let ids = []
        let max = 500
        let i

        for (i = 0; i < max; i++) {
            ids.push(jaul.data.uuid())
        }

        let noduplicates = lodash.uniq(ids)

        if (noduplicates.length == max) {
            done()
        } else {
            done("Out of " + max + ", " + max - noduplicates.length + " of the generated IDs were not unique.")
        }
    })
})
