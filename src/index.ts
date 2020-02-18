// JAUL: index.ts

import DataUtils = require("./data")
import IOUtils = require("./io")
import NetworkUtils = require("./network")
import SystemUtils = require("./system")

/** Main JAUL class. */
class JAUL {
    private static _instance: JAUL
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /** Returns a new fresh instance of the App module. */
    newInstance(): JAUL {
        return new JAUL()
    }

    /** Default App constructor. */
    constructor() {
        this.version = JSON.parse(require("fs").readFileSync(`${__dirname}/../package.json`, {encoding: "utf8"})).version
    }

    /** [[DataUtils]] exposed as .data */
    data: DataUtils = require("./data")

    /** [[IOUtils]] exposed as .io */
    io: IOUtils = require("./io")

    /** [[NetworkUtils]] exposed as .network */
    network: NetworkUtils = require("./network")

    /** [[SystemUtils]] exposed as .system */
    system: SystemUtils = require("./system")
}

// Exports...
export = JAUL.Instance
