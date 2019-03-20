// TEST: IO

var env = process.env
var fs = require("fs")
var chai = require("chai")
var mocha = require("mocha")
var describe = mocha.describe
var before = mocha.before
var after = mocha.after
var it = mocha.it
chai.should()

describe("JAUL IO Tests", function() {
    env.NODE_ENV = "test"

    var jaul = require("../index")

    var recursiveTarget = __dirname + "/mkdir/directory/inside/another"

    var cleanup = function() {
        if (fs.existsSync(recursiveTarget)) {
            fs.rmdirSync(__dirname + "/mkdir/directory/inside/another")
            fs.rmdirSync(__dirname + "/mkdir/directory/inside")
            fs.rmdirSync(__dirname + "/mkdir/directory")
            fs.rmdirSync(__dirname + "/mkdir")
        }
    }

    before(function() {
        cleanup()
    })

    after(function() {
        cleanup()
    })

    it("Gets file from current folder using getFilePath", function(done) {
        let currentFile = jaul.io.getFilePath("package.json")

        if (currentFile) {
            done()
        } else {
            done("Could not find package.json file")
        }
    })

    it("Fails to get non existing file using getFilePath", function(done) {
        let currentFile = jaul.io.getFilePath("this-does-not.exist")

        if (currentFile) {
            done("The getFilePath('this-does-not.exist') should return null")
        } else {
            done()
        }
    })

    it("Creates directory recursively", function(done) {
        this.timeout = 5000

        var checkDir = function() {
            var stat = fs.statSync(recursiveTarget)

            if (stat.isDirectory()) {
                done()
            } else {
                done("Folder " + recursiveTarget + " was not created.")
            }
        }

        jaul.io.mkdirRecursive(recursiveTarget)

        setTimeout(checkDir, 1000)
    })
})
