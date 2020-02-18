"use strict";
// JAUL: index.ts
/** Main JAUL class. */
class JAUL {
    /** Default App constructor. */
    constructor() {
        /** [[DataUtils]] exposed as .data */
        this.data = require("./data");
        /** [[IOUtils]] exposed as .io */
        this.io = require("./io");
        /** [[NetworkUtils]] exposed as .network */
        this.network = require("./network");
        /** [[SystemUtils]] exposed as .system */
        this.system = require("./system");
        this.version = JSON.parse(require("fs").readFileSync(`${__dirname}/../package.json`, { encoding: "utf8" })).version;
    }
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    /** Returns a new fresh instance of the App module. */
    newInstance() {
        return new JAUL();
    }
}
module.exports = JAUL.Instance;
