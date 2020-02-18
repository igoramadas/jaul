// JAUL: index.ts

import {DataUtils} from "./data"
import {IOUtils} from "./io"
import {NetworkUtils} from "./network"
import {SystemUtils} from "./system"

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

    /** Package version. */
    version: string = JSON.parse(require("fs").readFileSync(`${__dirname}/../package.json`, {encoding: "utf8"})).version

    /** [[DataUtils]] exposed as .data */
    data: DataUtils = DataUtils.Instance

    /** [[IOUtils]] exposed as .io */
    io: IOUtils = IOUtils.Instance

    /** [[NetworkUtils]] exposed as .network */
    network: NetworkUtils = NetworkUtils.Instance

    /** [[SystemUtils]] exposed as .system */
    system: SystemUtils = SystemUtils.Instance
}

// Exports...
export = JAUL.Instance
