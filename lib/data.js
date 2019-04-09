"use strict";
const _ = require("lodash");
class DataUtils {
    static removeFromString(value, charsToRemove) {
        if (!value) {
            return value;
        }
        let result = value.toString();
        if (!Array.isArray(charsToRemove)) {
            charsToRemove = Array.from(charsToRemove);
        }
        for (let c of charsToRemove) {
            result = result.split(c).join("");
        }
        return result;
    }
    static maskString(value, maskChar, leaveLast) {
        if (!value) {
            return value;
        }
        value = value.toString();
        const separators = [" ", "-", "_", "+", "=", "/"];
        if (maskChar == null || maskChar == "") {
            maskChar = "*";
        }
        if (leaveLast == null || leaveLast < 1) {
            leaveLast = 0;
        }
        let result = "";
        let i = 0;
        const arr = value.split("");
        while (i < arr.length - leaveLast) {
            const char = arr[i];
            if (separators.indexOf(char) < 0) {
                result += maskChar;
            }
            else {
                result += char;
            }
            i++;
        }
        if (leaveLast > 0) {
            result += value.substr(value.length - leaveLast);
        }
        return result;
    }
    static minifyJson(source, asString) {
        if (_.isObject(source)) {
            source = JSON.stringify(source, null, 0);
        }
        let index = 0;
        const { length } = source;
        let result = "";
        let symbol = undefined;
        let position = undefined;
        while (index < length) {
            symbol = source.charAt(index);
            switch (symbol) {
                case "\t":
                case "\r":
                case "\n":
                case " ":
                    index += 1;
                    break;
                case "/":
                    symbol = source.charAt((index += 1));
                    switch (symbol) {
                        case "/":
                            position = source.indexOf("\n", index);
                            if (position < 0) {
                                position = source.indexOf("\r", index);
                            }
                            index = position > -1 ? position : length;
                            break;
                        case "*":
                            position = source.indexOf("*/", index);
                            if (position > -1) {
                                index = position += 2;
                                break;
                            }
                            throw new Error("Unterminated block comment.");
                        default:
                            throw new Error("Invalid comment.");
                    }
                    break;
                case '"':
                    position = index;
                    while (index < length) {
                        symbol = source.charAt((index += 1));
                        if (symbol === "\\") {
                            index += 1;
                        }
                        else if (symbol === '"') {
                            break;
                        }
                    }
                    if (source.charAt(index) === '"') {
                        result += source.slice(position, (index += 1));
                        break;
                    }
                    throw new Error("Unterminated string.");
                default:
                    result += symbol;
                    index += 1;
            }
        }
        if (asString) {
            return result;
        }
        else {
            return JSON.parse(result);
        }
    }
    static uuid() {
        const baseStr = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        const generator = function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        };
        return baseStr.replace(/[xy]/g, generator);
    }
}
module.exports = DataUtils;
