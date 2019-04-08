declare class DataUtils {
    /**
     * Removes all the specified characters from a string. For example you can cleanup
     * a phone number by using removeFromString(phone, [" ", "-", "(", ")", "/"]).
     * @param value The original value to be cleaned.
     * @param charsToRemove Array of characters or single string to be removed from the original string.
     * @returns Value with the characters removed.
     */
    static removeFromString(value: string, charsToRemove: any[] | string): string;
    /**
     * Masks the specified string. For eaxmple to mask a phone number but leave the
     * last 4 digits visible you could use maskString(phone, "X", 4).
     * @param value The original value to be masked.
     * @param maskChar Optional character to be used on the masking, default is *.
     * @param leaveLast Optional, leave last X positions of the string unmasked, default is 0.
     * @returns The masked string.
     */
    static maskString(value: string, maskChar?: string, leaveLast?: number): string;
    /**
     * Minify the passed JSON value. Removes comments, unecessary white spaces etc.
     * @param source The JSON string or object to be minified.
     * @param asString If true, return as string instead of JSON object, default is false.
     * @returns The minified JSON as object or string, depending on asString.
     */
    static minifyJson(source: string, asString?: boolean): any;
    /**
     * Generates a RFC4122-compliant unique ID using random numbers.
     * @returns A unique ID.
     */
    static uuid(): string;
}
export = DataUtils;
