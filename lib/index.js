"use strict";
class JAUL {
    constructor() {
        this.version = JSON.parse(require("fs").readFileSync(`${__dirname}/../package.json`, { encoding: "utf8" })).version;
        this.data = require("./data");
        this.io = require("./io");
        this.network = require("./network");
        this.system = require("./system");
    }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    newInstance() {
        return new JAUL();
    }
}
module.exports = JAUL.Instance;
