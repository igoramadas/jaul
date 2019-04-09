"use strict";
const fs = require("fs");
const path = require("path");
class IOUtils {
    static getFilePath(filename, basepath) {
        const originalFilename = filename.toString();
        let hasFile = false;
        if (basepath) {
            filename = path.resolve(basepath, originalFilename);
            hasFile = fs.existsSync(filename);
            if (hasFile) {
                return filename;
            }
        }
        hasFile = fs.existsSync(filename);
        if (hasFile) {
            return filename;
        }
        filename = path.resolve(process.cwd(), originalFilename);
        hasFile = fs.existsSync(filename);
        if (hasFile) {
            return filename;
        }
        filename = path.resolve(path.dirname(require.main.filename), originalFilename);
        hasFile = fs.existsSync(filename);
        if (hasFile) {
            return filename;
        }
        return null;
    }
    static copyFileSync(source, target) {
        const fileBuffer = fs.readFileSync(source);
        fs.writeFileSync(target, fileBuffer);
    }
    static mkdirRecursive(target) {
        let stat;
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
                    if (!stat.isDirectory()) {
                        ex.friendlyMessage = `Target ${p} is a file.`;
                        throw ex;
                    }
                }
            }
        };
        callback(target);
    }
    static sleep(ms) {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms);
        });
    }
}
module.exports = IOUtils;
