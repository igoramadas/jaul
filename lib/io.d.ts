declare class IOUtils {
    /**
     * Finds the correct path to the file looking first on the (optional) base path
     * then the current or running directory, finally the root directory.
     * Returns null if file is not found.
     * @param filename The filename to be searched
     * @param basepath Optional, basepath where to look for the file.
     * @returns The full path to the file if one was found, or null if not found.
     */
    static getFilePath(filename: string, basepath?: string): string;
    /**
     * Copy the `source` file to the `target`, both must be the full file path.
     * @param source The full source file path.
     * @param target The full target file path.
     */
    static copyFileSync(source: string, target: string): void;
    /**
     * Make sure the `target` directory exists by recursively iterating through its parents
     * and creating the directories.
     * @param target The full target path, with or without a trailing slash.
     */
    static mkdirRecursive(target: string): void;
    /**
     * Helper to delay async code execution. To be used inside async functions using await.
     * @param number - How long to stall the execution for, in milliseconds.
     * @returns A promise with a setTimeout for the specified milliseconds.
     */
    static sleep(ms: number): Promise<Function>;
}
export = IOUtils;
