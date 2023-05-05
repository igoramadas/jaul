// TEST: IO

import {after, before, describe, it} from "mocha"
require("chai").should()

describe("JAUL IO Tests", function () {
    let fs = require("fs")
    let jaul = null

    let recursiveTarget = __dirname + "/mkdir/directory/inside/another"
    let copyFileTarget = __dirname + "/test-io.js.copy"

    let cleanup = function () {
        if (fs.existsSync(recursiveTarget)) {
            fs.rmdirSync(__dirname + "/mkdir/directory/inside/another")
            fs.rmdirSync(__dirname + "/mkdir/directory/inside")
            fs.rmdirSync(__dirname + "/mkdir/directory")
            fs.rmdirSync(__dirname + "/mkdir")
        }

        if (fs.existsSync(copyFileTarget)) {
            fs.unlinkSync(copyFileTarget)
        }
    }

    before(function () {
        jaul = require("../src/index")
        cleanup()
    })

    after(function () {
        cleanup()
    })

    it("Gets file from app root folder using getFilePath", function (done) {
        let currentFile = jaul.io.getFilePath("package.json")

        if (currentFile) {
            done()
        } else {
            done("Could not find package.json file")
        }
    })

    it("Gets file from current folder using getFilePath", function (done) {
        let currentFile = jaul.io.getFilePath("test-io.ts", __dirname)

        if (currentFile) {
            done()
        } else {
            done("Could not find test-io.json file.")
        }
    })

    it("Fails to get non existing file using getFilePath", function (done) {
        let currentFile = jaul.io.getFilePath("this-does-not.exist")

        if (currentFile) {
            done("The getFilePath('this-does-not.exist') should return null.")
        } else {
            done()
        }
    })

    it("Fails to create invalid recursive directory", function (done) {
        try {
            jaul.io.mkdirRecursive("../../../../../../...someinvalidpath../!@#$%^&*()-+")
            done("The mkdirRecursive call should have thrown an exception.")
        } catch (ex) {
            done()
        }
    })

    it("Fails to create recursive directory due to existing file", function (done) {
        try {
            jaul.io.mkdirRecursive("./package.json")
            done("The mkdirRecursive call should have thrown an exception.")
        } catch (ex) {
            done()
        }
    })

    it("Copy file to another folder", function (done) {
        jaul.io.copyFileSync(__dirname + "/test-io.ts", copyFileTarget)

        if (fs.existsSync(copyFileTarget)) {
            done()
        } else {
            done("File not copied to " + copyFileTarget)
        }
    })

    it("Sleep test", async function () {
        await jaul.io.sleep(300)
        return true
    })
})
