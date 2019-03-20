/*/*
 * JAUL: IO utilities
 */

const fs = require("fs")
const path = require("path")

class IOUtils {
    private static _instance: IOUtils
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /*
     * Finds the correct path to the file looking first on current directory, then the running
     * directory, then the root directory of the app, then the parent of the root.
     * Returns null if file is not found.
     * @param filename - The filename to be searched
     * @returns The full path to the file if one was found, or null if not found.
     */
    getFilePath(filename: string) {
        const originalFilename = filename.toString()

        // Check if file exists on current directory.
        let hasFile = fs.existsSync(`./${filename}`)
        if (hasFile) {
            return filename
        }

        // Try running directory.
        filename = path.resolve(process.cwd(), originalFilename)
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        // Try application root path.
        filename = path.resolve(
            path.dirname(require.main.filename),
            originalFilename
        )
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        // Try parent paths...
        filename = path.resolve(__dirname, "../../", originalFilename)
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        filename = path.resolve(__dirname, "../", originalFilename)
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        // Nothing found, so return null.
        return null
    }

    /*
     * Copy the `source` file to the `target`, both must be the full file path.
     * @param source - The full source file path.
     * @param target - The full target file path.
     */
    copyFileSync(source: string, target: string) {
        const srcContents = fs.readFileSync(source)
        return fs.writeFileSync(target, srcContents)
    }

    /*
     * Make sure the `target` directory exists by recursively iterating through its parents
     * and creating the directories.
     * @param target - The full target path, with or without a trailing slash.
     */
    mkdirRecursive(target: string) {
        if (fs.existsSync(path.resolve(target))) {
            return
        }

        var callback = function(p) {
            p = path.resolve(p)

            try {
                fs.mkdirSync(p)
            } catch (ex) {
                if (ex.code === "ENOENT") {
                    callback(path.dirname(p))
                    callback(p)
                } else {
                    let stat
                    try {
                        stat = fs.statSync(p)
                    } catch (ex1) {
                        throw new Error(
                            `Can't create directory. ${ex1.message}`
                        )
                    }
                    if (!stat.isDirectory()) {
                        throw new Error(`Can't create directory. ${ex.message}`)
                    }
                }
            }

            return target
        }

        return callback(target)
    }

    /*
     * Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @promise
     */
    sleep(ms: number) {
        return new Promise(function(resolve) {
            return setTimeout(resolve, ms)
        })
    }
}

// Exports singleton.
export = IOUtils.Instance
