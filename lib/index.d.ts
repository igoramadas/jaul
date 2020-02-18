import DataUtils = require("./data");
import IOUtils = require("./io");
import NetworkUtils = require("./network");
import SystemUtils = require("./system");
declare class JAUL {
    private static _instance;
    static get Instance(): JAUL;
    newInstance(): JAUL;
    version: string;
    data: DataUtils;
    io: IOUtils;
    network: NetworkUtils;
    system: SystemUtils;
}
declare const _default: JAUL;
export = _default;
