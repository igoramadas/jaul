// JAUL: data.ts

/** @hidden */
const _ = require("lodash")

class DataUtils {
    /**
     * Removes all the specified characters from a string. For example you can cleanup
     * a phone number by using removeFromString(phone, [" ", "-", "(", ")", "/"]).
     * @param value The original value to be cleaned.
     * @param charsToRemove Array of characters or single string to be removed from the original string.
     * @returns Value with the characters removed.
     */
    static removeFromString(value: string, charsToRemove: any[] | string): string {
        if (!value) {
            return value
        }

        // Make sure value is a valid string.
        let result = value.toString()

        if (!Array.isArray(charsToRemove)) {
            charsToRemove = Array.from(charsToRemove)
        }

        for (let c of charsToRemove) {
            result = result.split(c).join("")
        }

        return result
    }

    /**
     * Masks the specified string. For eaxmple to mask a phone number but leave the
     * last 4 digits visible you could use maskString(phone, "X", 4).
     * @param value The original value to be masked.
     * @param maskChar Optional character to be used on the masking, default is *.
     * @param leaveLast Optional, leave last X positions of the string unmasked, default is 0.
     * @returns The masked string.
     */
    static maskString(value: string, maskChar?: string, leaveLast?: number): string {
        if (!value) {
            return value
        }

        // Make sure value is a valid string.
        value = value.toString()

        const separators = [" ", "-", "_", "+", "=", "/"]

        if (maskChar == null || maskChar == "") {
            maskChar = "*"
        }

        if (leaveLast == null || leaveLast < 1) {
            leaveLast = 0
        }

        let result = ""
        let i = 0

        // First split characters, then iterate to replace.
        const arr = value.split("")

        while (i < arr.length - leaveLast) {
            const char = arr[i]

            if (separators.indexOf(char) < 0) {
                result += maskChar
            } else {
                result += char
            }

            i++
        }

        // Leave last characters?
        if (leaveLast > 0) {
            result += value.substr(value.length - leaveLast)
        }

        return result
    }

    /**
     * Minify the passed JSON value. Removes comments, unecessary white spaces etc.
     * @param source The JSON string or object to be minified.
     * @param asString If true, return as string instead of JSON object, default is false.
     * @returns The minified JSON as object or string, depending on asString.
     */
    static minifyJson(source: string, asString?: boolean): any {
        if (_.isObject(source)) {
            source = JSON.stringify(source, null, 0)
        }

        let index = 0
        const {length} = source
        let result = ""
        let symbol = undefined
        let position = undefined

        // Main iterator.
        while (index < length) {
            symbol = source.charAt(index)

            switch (symbol) {
                // Ignore whitespace tokens. According to ES 5.1 section 15.12.1.1,
                // whitespace tokens include tabs, carriage returns, line feeds, and
                // space characters.
                /* istanbul ignore next */
                case "\t":
                /* istanbul ignore next */
                case "\r":
                case "\n":
                case " ":
                    index += 1
                    break

                // Ignore line and block comments.
                case "/":
                    symbol = source.charAt((index += 1))
                    switch (symbol) {
                        // Line comments.
                        case "/":
                            position = source.indexOf("\n", index)

                            // Check for CR-style line endings.
                            if (position < 0) {
                                position = source.indexOf("\r", index)
                            }
                            index = position > -1 ? position : length
                            break

                        // Block comments.
                        case "*":
                            position = source.indexOf("*/", index)
                            if (position > -1) {
                                // Advance the scanner's position past the end of the comment.
                                index = position += 2
                                break
                            }
                            throw new Error("Unterminated block comment.")
                        default:
                            throw new Error("Invalid comment.")
                    }
                    break

                // Parse strings separately to ensure that any whitespace characters and
                // JavaScript-style comments within them are preserved.
                case '"':
                    position = index
                    while (index < length) {
                        symbol = source.charAt((index += 1))
                        if (symbol === "\\") {
                            // Skip past escaped characters.
                            index += 1
                        } else if (symbol === '"') {
                            break
                        }
                    }
                    if (source.charAt(index) === '"') {
                        result += source.slice(position, (index += 1))
                        break
                    }
                    throw new Error("Unterminated string.")

                // Preserve all other characters.
                default:
                    result += symbol
                    index += 1
            }
        }

        // Check if should return as string or JSON.
        if (asString) {
            return result
        } else {
            return JSON.parse(result)
        }
    }

    /**
     * Generates a RFC4122-compliant unique ID using random numbers.
     * @returns A unique ID.
     */
    static uuid(): string {
        const baseStr = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

        const generator = function(c) {
            const r = (Math.random() * 16) | 0
            const v = c === "x" ? r : (r & 0x3) | 0x8
            return v.toString(16)
        }

        return baseStr.replace(/[xy]/g, generator)
    }
}

// Exports...
export = DataUtils
