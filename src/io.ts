// JAUL: io.ts

import fs = require("fs")
import path = require("path")

/** IO Utilities class. */
export class IOUtils {
    private static _instance: IOUtils
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Finds the correct path to the file looking first on the (optional) base path
     * then the current or running directory, finally the root directory.
     * Returns null if file is not found.
     * @param filename The filename to be searched
     * @param basepath Optional, basepath where to look for the file.
     * @returns The full path to the file if one was found, or null if not found.
     */
    getFilePath = (filename: string, basepath?: string): string => {
        const originalFilename = filename.toString()
        let hasFile = false

        // A basepath was passed? Try there first.
        if (basepath) {
            filename = path.resolve(basepath, originalFilename)
            hasFile = fs.existsSync(filename)
            /* istanbul ignore else */
            if (hasFile) {
                return filename
            }
        }

        // Try running directory.
        filename = path.resolve(process.cwd(), originalFilename)
        hasFile = fs.existsSync(filename)
        /* istanbul ignore if */
        if (hasFile) {
            return filename
        }

        // Try application root path.
        filename = path.resolve(path.dirname(require.main.filename), originalFilename)
        hasFile = fs.existsSync(filename)
        /* istanbul ignore if */
        if (hasFile) {
            return filename
        }

        // Try local / absolute path.
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
    copyFileSync = (source: string, target: string): void => {
        const fileBuffer = fs.readFileSync(source)
        fs.writeFileSync(target, fileBuffer)
    }

    /**
     * Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @returns A promise with a setTimeout for the specified milliseconds.
     */
    sleep = (ms: number): Promise<Function> => {
        return new Promise(function (resolve) {
            return setTimeout(resolve, ms)
        })
    }
}

// Exports...
export default IOUtils.Instance
