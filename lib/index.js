"use strict";
let version;
try {
    version = JSON.parse(require("fs").readFileSync(`${__dirname}/../package.json`, { encoding: "utf8" })).version;
}
catch (ex) {
    version = null;
}
let index = {
    data: require("./data"),
    io: require("./io"),
    network: require("./network"),
    system: require("./system"),
    version: version
};
module.exports = index;
