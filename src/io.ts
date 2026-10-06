// JAUL: io.ts

import {setTimeout} from "node:timers/promises"
import fs from "fs"
import path from "path"

/**
 * IO Utilities
 */
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
        const mainFile = require.main?.filename ?? process.argv[1]
        const directories = [basepath, process.cwd(), mainFile ? path.dirname(mainFile) : null].filter((directory) => directory != null)
        return directories.map((directory) => path.resolve(directory, originalFilename)).find((candidate) => fs.existsSync(candidate)) ?? null
    }

    /**
     * DEPRECATED! Copy the `source` file to the `target`, both must be the full file path.
     * @param source The full source file path.
     * @param target The full target file path.
     * @deprecated Use fs.copyFileSync instead.
     */
    copyFileSync = (source: string, target: string): void => {
        fs.copyFileSync(source, target)
    }

    /**
     * DEPRECATED! Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @returns A promise with a setTimeout for the specified milliseconds.
     * @deprecated Use setTimeout from "node:timers/promises" instead.
     */
    sleep = (ms: number): Promise<void> => {
        return setTimeout(ms)
    }
}

// Exports...
export default IOUtils.Instance
