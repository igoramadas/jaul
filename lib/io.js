"use strict";
// JAUL: io.ts
/** @hidden */
const fs = require("fs");
/** @hidden */
const path = require("path");
/** IO Utilities class. */
class IOUtils {
    /**
     * Finds the correct path to the file looking first on the (optional) base path
     * then the current or running directory, finally the root directory.
     * Returns null if file is not found.
     * @param filename The filename to be searched
     * @param basepath Optional, basepath where to look for the file.
     * @returns The full path to the file if one was found, or null if not found.
     */
    static getFilePath(filename, basepath) {
        const originalFilename = filename.toString();
        let hasFile = false;
        // A basepath was passed? Try there first.
        if (basepath) {
            filename = path.resolve(basepath, originalFilename);
            hasFile = fs.existsSync(filename);
            /* istanbul ignore else */
            if (hasFile) {
                return filename;
            }
        }
        // Try running directory.
        filename = path.resolve(process.cwd(), originalFilename);
        hasFile = fs.existsSync(filename);
        /* istanbul ignore if */
        if (hasFile) {
            return filename;
        }
        // Try application root path.
        filename = path.resolve(path.dirname(require.main.filename), originalFilename);
        hasFile = fs.existsSync(filename);
        /* istanbul ignore if */
        if (hasFile) {
            return filename;
        }
        // Try local / absolute path.
        hasFile = fs.existsSync(filename);
        if (hasFile) {
            return filename;
        }
        // Nothing found, so return null.
        return null;
    }
    /**
     * Copy the `source` file to the `target`, both must be the full file path.
     * @param source The full source file path.
     * @param target The full target file path.
     */
    static copyFileSync(source, target) {
        const fileBuffer = fs.readFileSync(source);
        fs.writeFileSync(target, fileBuffer);
    }
    /**
     * Make sure the `target` directory exists by recursively iterating through its parents
     * and creating the directories.
     * @param target The full target path, with or without a trailing slash.
     */
    static mkdirRecursive(target) {
        let stat;
        // Check if exists and not a file.
        if (fs.existsSync(path.resolve(target))) {
            stat = fs.statSync(target);
            if (!stat.isDirectory()) {
                throw new Error(`Target ${target} is a file.`);
            }
            return;
        }
        var callback = function (p) {
            p = path.resolve(p);
            try {
                fs.mkdirSync(p);
            }
            catch (ex) {
                if (ex.code === "ENOENT") {
                    callback(path.dirname(p));
                    callback(p);
                }
                else {
                    let stat;
                    try {
                        stat = fs.statSync(p);
                    }
                    catch (ex1) {
                        ex1.friendlyMessage = `Can't create directory: ${p}`;
                        throw ex1;
                    }
                    /* istanbul ignore next */
                    if (!stat.isDirectory()) {
                        ex.friendlyMessage = `Target ${p} is a file.`;
                        throw ex;
                    }
                }
            }
        };
        callback(target);
    }
    /**
     * Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @returns A promise with a setTimeout for the specified milliseconds.
     */
    static sleep(ms) {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms);
        });
    }
}
module.exports = IOUtils;
