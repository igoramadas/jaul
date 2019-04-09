declare class IOUtils {
    static getFilePath(filename: string, basepath?: string): string;
    static copyFileSync(source: string, target: string): void;
    static mkdirRecursive(target: string): void;
    static sleep(ms: number): Promise<Function>;
}
export = IOUtils;
