// JAUL: index.ts

/** @hidden */
let version

// Get package version.
try {
    version = JSON.parse(require("fs").readFileSync(`${__dirname}/../package.json`, {encoding: "utf8"})).version
} catch (ex) {
    version = null
}

/** Exposes all utilities under their respective categories. */
let index = {
    /** [[DataUtils]] exposed as .data */
    data: require("./data"),
    /** [[IOUtils]] exposed as .io */
    io: require("./io"),
    /** [[NetworkUtils]] exposed as .network */
    network: require("./network"),
    /** [[SystemUtils]] exposed as .system */
    system: require("./system"),
    /** Library version */
    version: version
}

export = index
