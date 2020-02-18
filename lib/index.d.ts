import DataUtils = require("./data");
import IOUtils = require("./io");
import NetworkUtils = require("./network");
import SystemUtils = require("./system");
/** Main JAUL class. */
declare class JAUL {
    private static _instance;
    /** @hidden */
    static get Instance(): JAUL;
    /** Returns a new fresh instance of the App module. */
    newInstance(): JAUL;
    /** Default App constructor. */
    constructor();
    /** [[DataUtils]] exposed as .data */
    data: DataUtils;
    /** [[IOUtils]] exposed as .io */
    io: IOUtils;
    /** [[NetworkUtils]] exposed as .network */
    network: NetworkUtils;
    /** [[SystemUtils]] exposed as .system */
    system: SystemUtils;
}
declare const _default: JAUL;
export = _default;
