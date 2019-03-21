/**
 * JAUL: IO utilities
 */

const fs = require("fs")
const path = require("path")

class IOUtils {
    /**
     * Finds the correct path to the file looking first on current directory, then the running
     * directory, then the root directory of the app, then the parent of the root.
     * Returns null if file is not found.
     * @param filename The filename to be searched
     * @returns The full path to the file if one was found, or null if not found.
     */
    static getFilePath(filename: string): string {
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
        filename = path.resolve(path.dirname(require.main.filename), originalFilename)
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        // Try second level parent path. In case module is under node_modules.
        filename = path.resolve(__dirname, "../../", originalFilename)
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        // Try parent path.
        filename = path.resolve(__dirname, "../", originalFilename)
        hasFile = fs.existsSync(filename)
        if (hasFile) {
            return filename
        }

        // Nothing found, so return null.
        return null
    }

    /**
     * Copy the `source` file to the `target`, both must be the full file path.
     * @param source The full source file path.
     * @param target The full target file path.
     */
    static copyFileSync(source: string, target: string): void {
        const fileBuffer = fs.readFileSync(source)
        fs.writeFileSync(target, fileBuffer)
    }

    /**
     * Make sure the `target` directory exists by recursively iterating through its parents
     * and creating the directories.
     * @param target The full target path, with or without a trailing slash.
     */
    static mkdirRecursive(target: string): void {
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
                        ex1.friendlyMessage = `Can't create directory: ${p}`
                        throw ex1
                    }
                    if (!stat.isDirectory()) {
                        ex.friendlyMessage = `Can't create directory: ${p}`
                        throw ex
                    }
                }
            }
        }

        callback(target)
    }

    /**
     * Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @returns A promise with a setTimeout for the specified milliseconds.
     */
    static sleep(ms: number): Promise<Function> {
        return new Promise(function(resolve) {
            return setTimeout(resolve, ms)
        })
    }
}

// Exports singleton.
export = IOUtils
